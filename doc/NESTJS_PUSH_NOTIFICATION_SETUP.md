# NestJS Backend Push Notification Documentation

## Goal
Implement backend support for mobile push notifications for the app.

Frontend currently sends push token data after login and expects backend to:
- Store/update user device tokens
- Send push notifications on business events (order update, chat, payment, etc.)
- Handle invalid tokens and cleanup

---

## 1) API Contract

### 1.1 Save/Update Push Token

- **Method**: `POST /notifications/fcm-token`
- **Auth**: Bearer token required
- **Request body**:

```json
{
  "token": "ExponentPushToken[...] or fcm_token",
  "expoPushToken": "ExponentPushToken[...]",
  "devicePushToken": "fcm_or_apns_token",
  "devicePushTokenType": "fcm",
  "platform": "android"
}
```

- **Notes**:
  - `token` is fallback (expo or native token)
  - Prefer storing both `expoPushToken` and `devicePushToken` when present
  - Upsert by token + user

- **Success response**:

```json
{
  "success": true,
  "message": "Push token saved"
}
```

### 1.2 Remove Push Token (Logout)

- **Method**: `DELETE /notifications/fcm-token`
- **Auth**: Bearer token required
- **Request body**:

```json
{
  "token": "<fcm-device-token>"
}
```

### 1.3 Optional Test Push Endpoint

- **Method**: `POST /notifications/test`
- **Auth**: admin/internal
- **Body**:

```json
{
  "userId": "uuid-or-id",
  "title": "Test Notification",
  "body": "This is a test",
  "data": {
    "screen": "OrderDetails",
    "orderId": "123"
  }
}
```

---

## 2) Data Model (Recommended)

Create a `push_tokens` table/collection:

- `id`
- `userId` (indexed)
- `expoPushToken` (nullable, indexed)
- `devicePushToken` (nullable, indexed)
- `devicePushTokenType` (`fcm` | `apns`, nullable)
- `platform` (`android` | `ios` | `web`)
- `isActive` (default `true`)
- `lastSeenAt`
- `createdAt`
- `updatedAt`

### Rules
- Prevent duplicates with unique index where possible
- One user can have multiple devices/tokens
- On logout, either delete token or set `isActive=false`

---

## 3) NestJS Module Structure

Recommended modules:

- `push-token` module
  - `PushTokenController`
  - `PushTokenService`
  - `dto/save-push-token.dto.ts`
- `notifications` module
  - `NotificationsService`
  - `providers/expo.provider.ts` or `providers/fcm.provider.ts`

---

## 4) DTO Example

```ts
import { IsIn, IsOptional, IsString } from 'class-validator';

export class SavePushTokenDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  expoPushToken?: string;

  @IsOptional()
  @IsString()
  devicePushToken?: string;

  @IsOptional()
  @IsIn(['fcm', 'apns'])
  devicePushTokenType?: 'fcm' | 'apns';

  @IsOptional()
  @IsIn(['android', 'ios', 'web'])
  platform?: 'android' | 'ios' | 'web';
}
```

---

## 5) Controller Example

```ts
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class PushTokenController {
  constructor(private readonly pushTokenService: PushTokenService) {}

  @Post('fcm-token')
  async saveToken(@Req() req: any, @Body() dto: SavePushTokenDto) {
    await this.pushTokenService.upsertUserToken(req.user.id, dto);
    return { success: true, message: 'Push token saved' };
  }

  @Delete('fcm-token')
  async removeToken(@Req() req: any, @Body() dto: SavePushTokenDto) {
    await this.pushTokenService.removeUserToken(req.user.id, dto.token);
    return { success: true };
  }
}
```

---

## 6) Service Logic (Upsert)

1. Validate token payload
2. Resolve final values:
   - `expoPushToken = dto.expoPushToken ?? (dto.token startsWith("ExponentPushToken") ? dto.token : null)`
   - `devicePushToken = dto.devicePushToken ?? (dto.devicePushTokenType ? dto.token : null)`
3. Upsert token row (user + token unique strategy)
4. Set `isActive=true`, update `lastSeenAt`

---

## 7) Sending Notifications

Choose one delivery path:

1. **Expo Push API** (fastest start)
2. **Direct FCM/APNs** (full control)

### Recommended start
- Use Expo push first for stability with current app setup.
- Keep native token stored for future direct-FCM migration.

### Payload shape

```json
{
  "title": "Order Updated",
  "body": "Your order is now shipped",
  "data": {
    "type": "ORDER_STATUS",
    "orderId": "123",
    "screen": "OrderDetails"
  }
}
```

---

## 8) Failure Handling & Cleanup

When provider response says token invalid:
- mark `isActive=false` or delete token
- log reason (`NotRegistered`, `InvalidCredentials`, etc.)

Retry strategy:
- transient/network errors: retry with backoff
- permanent token errors: no retry

---

## 9) Security Requirements

- Never store Firebase service account private key in mobile repo
- Keep keys in backend secret manager / environment variables
- Revoke rotated/exposed keys immediately

---

## 10) Environment Variables (Example)

```env
# If using Expo Push API
EXPO_ACCESS_TOKEN=

# If using direct FCM v1
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 11) End-to-End Test Checklist

1. User লগইন করে token register call hit হচ্ছে কি না
2. `POST /notifications/fcm-token` returns success
3. DB-তে token row save হচ্ছে
4. Admin test endpoint দিয়ে push পাঠানো যাচ্ছে
5. App foreground/background state-এ notification receive হচ্ছে
6. Invalid token-এ cleanup হচ্ছে

---

## 12) Definition of Done

- Token save endpoint live
- Token persistence + dedupe implemented
- Notification sender service live
- Invalid token cleanup live
- One business event (e.g. order status update) থেকে push verified
