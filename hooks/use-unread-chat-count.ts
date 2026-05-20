import { useMemo } from "react";
import { useGetConversationsQuery } from "@/store/api/chatApiSlice";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";

const normalizeId = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const resolveChatUserId = (entity: any) =>
  normalizeId(
    entity?.userId ??
      entity?.buyer?.userId ??
      entity?.vendor?.userId ??
      entity?.user?.userId ??
      entity?.id ??
      entity?._id ??
      entity,
  );

export const useUnreadChatCount = () => {
  const user = useAppSelector(selectCurrentUser);
  const currentUserId = resolveChatUserId(user);

  const { data: conversationsData = [] } = useGetConversationsQuery(
    currentUserId,
    {
      skip: !currentUserId,
      refetchOnMountOrArgChange: true,
    },
  );

  return useMemo(() => {
    if (!Array.isArray(conversationsData)) return 0;

    return conversationsData.reduce((total: number, conversation: any) => {
      return total + Number(conversation?.unreadCount || 0);
    }, 0);
  }, [conversationsData]);
};
