import Product from "@/app/(tabs)/product";
import { router } from "expo-router";
import { images } from "./import_images";

export const commonData = [
    {
        "metric": "Sales",
        "value": "$12,345",
        "change": "+10%",
        "trend": "up"
    },
    {
        "metric": "Active Orders",
        "value": "25",
        "change": "-5%",
        "trend": "down"
    },
    {
        "metric": "Products",
        "value": "150",
        "change": "+2%",
        "trend": "up"
    },
    {
        "metric": "New client",
        "value": "12,345",
        "change": "+10%",
        "trend": "up"
    }
];
// Quick actions data
export const quickActions = [
    { id: 1, name: 'Add Product', icon: images.add_product, onPress: () => router.push('/(screens)/EditProduct') },
    { id: 2, name: 'Orders', icon: images.order_icon, onPress: () => router.push('/(tabs)/order') },
    { id: 3, name: 'Payments', icon: images.qr_payment, onPress: () => router.push('/(screens)/transaction_history') },
    { id: 4, name: 'My QR Code', icon: images.qr_scan, onPress: () => router.push('/(screens)/qr_code') },
];
export const recentOrders = [
    {
        id: 'ORD-2025',
        orderNumber: '#ORD-2025',

        customer: {
            name: 'Ronald Richards',
            customerId: '#225432',
            avatar: 'https://i.pravatar.cc/150?img=12'
        },

        orderItems: [
            {
                id: '1',
                title: 'Wireless Headphones',
                description: 'Lorem ipsum ultricies in tortor...',
                price: 20,
                quantity: 2,
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
            },
            {
                id: '2',
                title: 'Bluetooth Speaker',
                description: 'Lorem ipsum ultricies in tortor...',
                price: 20,
                quantity: 2,
                image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb'
            }
        ],

        payment: {
            subtotal: 80,
            tax: 10,
            shipping: 0.6,
            grandTotal: 90.6,
            status: 'Paid',
            method: 'Visa Credit Card ending 4242'
        },

        orderStatus: {
            status: 'Processing',
            location: 'Mirpur 11, Dhaka',
            date: '22 May 2025'
        }
    },

    {
        id: 'ORD-2024',
        orderNumber: '#ORD-2024',

        customer: {
            name: 'John Doe',
            customerId: '#225433',
            avatar: 'https://i.pravatar.cc/150?img=15'
        },

        orderItems: [
            {
                id: '1',
                title: 'Smart Watch Pro',
                description: 'Fitness tracking smartwatch',
                price: 200,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
            },
            {
                id: '2',
                title: 'Fast Charger',
                description: 'USB-C fast charger',
                price: 50,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0'
            }
        ],

        payment: {
            subtotal: 250,
            tax: 20,
            shipping: 5,
            grandTotal: 275,
            status: 'Paid',
            method: 'MasterCard ending 2211'
        },

        orderStatus: {
            status: 'Completed',
            location: 'Manchester, KY',
            date: '13 May 2025'
        }
    },

    {
        id: 'ORD-2026',
        orderNumber: '#ORD-2026',

        customer: {
            name: 'Emma Wilson',
            customerId: '#225434',
            avatar: 'https://i.pravatar.cc/150?img=32'
        },

        orderItems: [
            {
                id: '1',
                title: 'Gaming Console',
                description: 'Next-gen gaming console',
                price: 499.99,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e'
            }
        ],

        payment: {
            subtotal: 499.99,
            tax: 30,
            shipping: 0,
            grandTotal: 529.99,
            status: 'Paid',
            method: 'Visa ending 8899'
        },

        orderStatus: {
            status: 'Delivered',
            location: 'California',
            date: '07 May 2025'
        }
    },

    {
        id: 'ORD-2027',
        orderNumber: '#ORD-2027',

        customer: {
            name: 'Sarah Johnson',
            customerId: '#225435',
            avatar: 'https://i.pravatar.cc/150?img=47'
        },

        orderItems: [
            {
                id: '1',
                title: 'Laptop',
                description: 'High performance laptop',
                price: 1000,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'
            },
            {
                id: '2',
                title: 'Wireless Mouse',
                description: 'Ergonomic mouse',
                price: 125.25,
                quantity: 2,
                image: 'https://images.unsplash.com/photo-1527814050087-3793815479db'
            }
        ],

        payment: {
            subtotal: 1250.5,
            tax: 80,
            shipping: 10,
            grandTotal: 1340.5,
            status: 'Pending',
            method: 'Cash on Delivery'
        },

        orderStatus: {
            status: 'Processing',
            location: 'Hawaii',
            date: '16 May 2025'
        }
    },

    {
        id: 'ORD-2028',
        orderNumber: '#ORD-2028',

        customer: {
            name: 'Michael Brown',
            customerId: '#225436',
            avatar: 'https://i.pravatar.cc/150?img=18'
        },

        orderItems: [
            {
                id: '1',
                title: 'Wireless Earbuds',
                description: 'Noise canceling earbuds',
                price: 70,
                quantity: 2,
                image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df'
            },
            {
                id: '2',
                title: 'Protective Case',
                description: 'Silicone earbuds case',
                price: 40,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1585386959984-a41552231693'
            }
        ],

        payment: {
            subtotal: 180,
            tax: 15,
            shipping: 5,
            grandTotal: 200,
            status: 'Paid',
            method: 'Visa ending 6622'
        },

        orderStatus: {
            status: 'Shipped',
            location: 'Connecticut',
            date: '14 May 2025'
        }
    },

    {
        id: 'ORD-2029',
        orderNumber: '#ORD-2029',

        customer: {
            name: 'David Wilson',
            customerId: '#225437',
            avatar: 'https://i.pravatar.cc/150?img=22'
        },

        orderItems: [
            {
                id: '1',
                title: 'Smartphone',
                description: 'Latest generation smartphone',
                price: 799.99,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'
            },
            {
                id: '2',
                title: 'Phone Case',
                description: 'Shockproof phone case',
                price: 100,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1580910051074-7e54d57f1c0b'
            }
        ],

        payment: {
            subtotal: 899.99,
            tax: 50,
            shipping: 0,
            grandTotal: 949.99,
            status: 'Paid',
            method: 'Visa ending 3344'
        },

        orderStatus: {
            status: 'Completed',
            location: 'Austin, TX',
            date: '03 May 2025'
        }
    }
];

// Sample products data
export const sampleProducts: Product[] = [
    {
        id: '1',
        name: 'Wireless Noise Canceling Headphones',
        sku: 'EC-100',
        price: "500",
        stock: 123,
        status: 'active',

        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
            'https://images.unsplash.com/photo-1585386959984-a41552231693'
        ],

        rating: 4.8,
        reviewsCount: 1200,

        stats: {
            onStock: 123,
            processing: 123,
            totalSold: 123
        },

        description:
            'Industry-leading noise cancelling with Dual Noise Sensor technology. Next-level music with Edge-A, co-developed with Sony Music Studios Tokyo. Up to 30-hour battery life with quick charging.',

        specification: {
            brand: 'JBL',
            model: 'Tune 720BT',
            connectivity: 'Bluetooth / Charging cable',
            bluetooth: '5.3',
            colors: ['Black', 'White'],
            weight: '220g',
            size: '40mm',
            chargingTime: '2 hours',
            playtime: 'Up to 76 hours'
        }
    },

    {
        id: '2',
        name: 'Smartphone X',
        sku: 'SP-200',
        price: "899.99",
        stock: 5,
        status: 'low_stock',

        images: [
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'
        ],

        rating: 4.6,
        reviewsCount: 980,

        stats: {
            onStock: 5,
            processing: 2,
            totalSold: 540
        },

        description:
            'High-performance smartphone with OLED display, ultra-fast processor, professional camera system and long-lasting battery.',

        specification: {
            brand: 'TechX',
            model: 'X-Pro',
            connectivity: '5G / USB-C',
            bluetooth: '5.2',
            colors: ['Black', 'Blue'],
            weight: '190g',
            size: '6.5 inch',
            chargingTime: '1.5 hours',
            playtime: 'Up to 24 hours'
        }
    },

    {
        id: '3',
        name: 'Wireless Earbuds Pro',
        sku: 'EP-300',
        price: "149.99",
        stock: 0,
        status: 'draft',

        images: [
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df'
        ],

        rating: 4.4,
        reviewsCount: 760,

        stats: {
            onStock: 0,
            processing: 0,
            totalSold: 890
        },

        description:
            'Premium wireless earbuds with immersive sound, active noise cancellation, and compact charging case.',

        specification: {
            brand: 'SoundMax',
            model: 'Pro Buds',
            connectivity: 'Bluetooth / Type-C',
            bluetooth: '5.3',
            colors: ['Black', 'White'],
            weight: '60g',
            size: 'In-ear',
            chargingTime: '1 hour',
            playtime: 'Up to 28 hours'
        }
    },

    {
        id: '4',
        name: 'Smart Watch Pro',
        sku: 'SW-400',
        price: "249.99",
        stock: 12,
        status: 'active',

        images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
        ],

        rating: 4.7,
        reviewsCount: 1500,

        stats: {
            onStock: 12,
            processing: 4,
            totalSold: 1020
        },

        description:
            'Advanced smartwatch with fitness tracking, heart-rate monitoring, AMOLED display, and water resistance.',

        specification: {
            brand: 'FitTime',
            model: 'Pro X',
            connectivity: 'Bluetooth / Magnetic charger',
            bluetooth: '5.1',
            colors: ['Black', 'Silver'],
            weight: '55g',
            size: '1.9 inch',
            chargingTime: '2 hours',
            playtime: 'Up to 14 days'
        }
    },

    {
        id: '5',
        name: 'Bluetooth Speaker',
        sku: 'BS-500',
        price: "79.99",
        stock: 8,
        status: 'active',

        images: [
            'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb'
        ],

        rating: 4.5,
        reviewsCount: 640,

        stats: {
            onStock: 8,
            processing: 3,
            totalSold: 780
        },

        description:
            'Portable Bluetooth speaker with deep bass, waterproof design, and long battery life.',

        specification: {
            brand: 'BoomSound',
            model: 'BS-500',
            connectivity: 'Bluetooth / USB',
            bluetooth: '5.0',
            colors: ['Red', 'Black'],
            weight: '480g',
            size: 'Medium',
            chargingTime: '3 hours',
            playtime: 'Up to 20 hours'
        }
    },

    {
        id: '6',
        name: 'Laptop Stand',
        sku: 'LS-600',
        price: "39.99",
        stock: 3,
        status: 'low_stock',

        images: [
            'https://images.unsplash.com/photo-1581094794329-e8f4acd3d9b7'
        ],

        rating: 4.3,
        reviewsCount: 320,

        stats: {
            onStock: 3,
            processing: 1,
            totalSold: 410
        },

        description:
            'Ergonomic aluminum laptop stand with adjustable height for better posture and airflow.',

        specification: {
            brand: 'DeskPro',
            model: 'LiftStand',
            connectivity: 'N/A',
            bluetooth: 'N/A',
            colors: ['Silver'],
            weight: '900g',
            size: 'Adjustable',
            chargingTime: 'N/A',
            playtime: 'N/A'
        }
    }
];

// Professional Chat Data Structure
export interface ChatMessage {
    id: string;
    text: string;
    timestamp: Date;
    isOwn: boolean;
    type: 'text' | 'image' | 'file';
}

export interface ChatConversation {
    id: string;
    participant: {
        id: string;
        name: string;
        avatar: string;
        customerId?: string;
        email?: string;
        phone?: string;
    };
    lastMessage: {
        text: string;
        timestamp: Date;
        isOwn: boolean;
    };
    unreadCount: number;
    isOnline: boolean;
    isTyping: boolean;
    messages: ChatMessage[];
    orderContext?: {
        orderId: string;
        orderNumber: string;
        status: string;
    };
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        isArchived: boolean;
        isStarred: boolean;
        tags: string[];
    };
}

export interface SupportTicket {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    category: 'technical' | 'billing' | 'shipping' | 'general' | 'product';
    customer: {
        id: string;
        name: string;
        email: string;
        avatar: string;
    };
    assignedTo?: {
        id: string;
        name: string;
        avatar: string;
    };
    createdAt: Date;
    updatedAt: Date;
    messages: ChatMessage[];
    attachments: string[];
}

// Sample Chat Conversations Data
export const chatConversations: ChatConversation[] = [
    {
        id: 'chat-001',
        participant: {
            id: 'user-001',
            name: 'Ronald Richards',
            avatar: 'https://i.pravatar.cc/150?img=12',
            customerId: '#225432',
            email: 'ronald.richards@email.com',
            phone: '+1-234-567-8900'
        },
        lastMessage: {
            text: 'Hey, how are you doing? I wanted to check on my order status.',
            timestamp: new Date('2025-12-30T14:30:00'),
            isOwn: false
        },
        unreadCount: 2,
        isOnline: true,
        isTyping: false,
        messages: [
            {
                id: 'msg-001',
                text: 'Hi! I have a question about my recent order.',
                timestamp: new Date('2025-12-30T14:25:00'),
                isOwn: false,
                type: 'text'
            },
            {
                id: 'msg-002',
                text: 'Hello! I\'d be happy to help you with your order. What\'s your order number?',
                timestamp: new Date('2025-12-30T14:27:00'),
                isOwn: true,
                type: 'text'
            },
            {
                id: 'msg-003',
                text: 'It\'s ORD-2025. I was wondering when it will be shipped.',
                timestamp: new Date('2025-12-30T14:28:00'),
                isOwn: false,
                type: 'text'
            },
            {
                id: 'msg-004',
                text: 'Let me check that for you... Your order is currently being processed and should ship within 24 hours.',
                timestamp: new Date('2025-12-30T14:29:00'),
                isOwn: true,
                type: 'text'
            },
            {
                id: 'msg-005',
                text: 'Hey, how are you doing? I wanted to check on my order status.',
                timestamp: new Date('2025-12-30T14:30:00'),
                isOwn: false,
                type: 'text'
            }
        ],
        orderContext: {
            orderId: 'ORD-2025',
            orderNumber: '#ORD-2025',
            status: 'Processing'
        },
        metadata: {
            createdAt: new Date('2025-12-30T14:25:00'),
            updatedAt: new Date('2025-12-30T14:30:00'),
            isArchived: false,
            isStarred: false,
            tags: ['order-inquiry', 'processing']
        }
    },
    {
        id: 'chat-002',
        participant: {
            id: 'user-002',
            name: 'Sarah Johnson',
            avatar: 'https://i.pravatar.cc/150?img=47',
            customerId: '#225435',
            email: 'sarah.j@email.com',
            phone: '+1-234-567-8901'
        },
        lastMessage: {
            text: 'The order has been shipped! Thank you so much!',
            timestamp: new Date('2025-12-30T13:15:00'),
            isOwn: false
        },
        unreadCount: 1,
        isOnline: false,
        isTyping: false,
        messages: [
            {
                id: 'msg-006',
                text: 'Hi, I just received a notification that my order was shipped.',
                timestamp: new Date('2025-12-30T13:10:00'),
                isOwn: false,
                type: 'text'
            },
            {
                id: 'msg-007',
                text: 'Yes, that\'s correct! Your gaming console has been shipped and should arrive in 3-5 business days.',
                timestamp: new Date('2025-12-30T13:12:00'),
                isOwn: true,
                type: 'text'
            },
            {
                id: 'msg-008',
                text: 'The order has been shipped! Thank you so much!',
                timestamp: new Date('2025-12-30T13:15:00'),
                isOwn: false,
                type: 'text'
            }
        ],
        orderContext: {
            orderId: 'ORD-2026',
            orderNumber: '#ORD-2026',
            status: 'Shipped'
        },
        metadata: {
            createdAt: new Date('2025-12-30T13:10:00'),
            updatedAt: new Date('2025-12-30T13:15:00'),
            isArchived: false,
            isStarred: true,
            tags: ['shipping', 'delivered']
        }
    },
    {
        id: 'chat-003',
        participant: {
            id: 'user-003',
            name: 'Michael Brown',
            avatar: 'https://i.pravatar.cc/150?img=18',
            customerId: '#225436',
            email: 'michael.b@email.com',
            phone: '+1-234-567-8902'
        },
        lastMessage: {
            text: 'Thanks for your help! Really appreciate it.',
            timestamp: new Date('2025-12-29T16:45:00'),
            isOwn: false
        },
        unreadCount: 0,
        isOnline: true,
        isTyping: false,
        messages: [
            {
                id: 'msg-009',
                text: 'I need help with my laptop order. Can you help me?',
                timestamp: new Date('2025-12-29T16:40:00'),
                isOwn: false,
                type: 'text'
            },
            {
                id: 'msg-010',
                text: 'Of course! I can help you with your laptop order. What seems to be the issue?',
                timestamp: new Date('2025-12-29T16:42:00'),
                isOwn: true,
                type: 'text'
            },
            {
                id: 'msg-011',
                text: 'I wanted to upgrade the RAM but I\'m not sure if it\'s possible.',
                timestamp: new Date('2025-12-29T16:43:00'),
                isOwn: false,
                type: 'text'
            },
            {
                id: 'msg-012',
                text: 'I\'ve checked your order and yes, we can upgrade the RAM to 16GB for an additional $50. Would you like me to update your order?',
                timestamp: new Date('2025-12-29T16:44:00'),
                isOwn: true,
                type: 'text'
            },
            {
                id: 'msg-013',
                text: 'Thanks for your help! Really appreciate it.',
                timestamp: new Date('2025-12-29T16:45:00'),
                isOwn: false,
                type: 'text'
            }
        ],
        orderContext: {
            orderId: 'ORD-2027',
            orderNumber: '#ORD-2027',
            status: 'Processing'
        },
        metadata: {
            createdAt: new Date('2025-12-29T16:40:00'),
            updatedAt: new Date('2025-12-29T16:45:00'),
            isArchived: false,
            isStarred: false,
            tags: ['product-inquiry', 'upgrade']
        }
    },
    {
        id: 'chat-004',
        participant: {
            id: 'user-004',
            name: 'Emily Wilson',
            avatar: 'https://i.pravatar.cc/150?img=32',
            customerId: '#225434',
            email: 'emily.w@email.com',
            phone: '+1-234-567-8903'
        },
        lastMessage: {
            text: 'Can you check my order status? It should have been delivered yesterday.',
            timestamp: new Date('2025-12-28T10:30:00'),
            isOwn: false
        },
        unreadCount: 3,
        isOnline: false,
        isTyping: true,
        messages: [
            {
                id: 'msg-014',
                text: 'Hello, I haven\'t received my order yet. It was supposed to be delivered yesterday.',
                timestamp: new Date('2025-12-28T10:25:00'),
                isOwn: false,
                type: 'text'
            },
            {
                id: 'msg-015',
                text: 'I\'m sorry to hear that. Let me check your tracking information right away.',
                timestamp: new Date('2025-12-28T10:27:00'),
                isOwn: true,
                type: 'text'
            },
            {
                id: 'msg-016',
                text: 'Can you check my order status? It should have been delivered yesterday.',
                timestamp: new Date('2025-12-28T10:30:00'),
                isOwn: false,
                type: 'text'
            }
        ],
        orderContext: {
            orderId: 'ORD-2026',
            orderNumber: '#ORD-2026',
            status: 'Delivered'
        },
        metadata: {
            createdAt: new Date('2025-12-28T10:25:00'),
            updatedAt: new Date('2025-12-28T10:30:00'),
            isArchived: false,
            isStarred: false,
            tags: ['delivery-issue', 'urgent']
        }
    },
    {
        id: 'chat-005',
        participant: {
            id: 'user-005',
            name: 'David Wilson',
            avatar: 'https://i.pravatar.cc/150?img=22',
            customerId: '#225437',
            email: 'david.w@email.com',
            phone: '+1-234-567-8904'
        },
        lastMessage: {
            text: 'Great! The smartphone looks amazing. Thanks for the quick delivery!',
            timestamp: new Date('2025-12-27T15:20:00'),
            isOwn: false
        },
        unreadCount: 0,
        isOnline: false,
        isTyping: false,
        messages: [
            {
                id: 'msg-017',
                text: 'Hi, I just received my smartphone and it\'s perfect!',
                timestamp: new Date('2025-12-27T15:15:00'),
                isOwn: false,
                type: 'text'
            },
            {
                id: 'msg-018',
                text: 'That\'s wonderful to hear! We\'re glad you\'re happy with your purchase.',
                timestamp: new Date('2025-12-27T15:18:00'),
                isOwn: true,
                type: 'text'
            },
            {
                id: 'msg-019',
                text: 'Great! The smartphone looks amazing. Thanks for the quick delivery!',
                timestamp: new Date('2025-12-27T15:20:00'),
                isOwn: false,
                type: 'text'
            }
        ],
        orderContext: {
            orderId: 'ORD-2029',
            orderNumber: '#ORD-2029',
            status: 'Completed'
        },
        metadata: {
            createdAt: new Date('2025-12-27T15:15:00'),
            updatedAt: new Date('2025-12-27T15:20:00'),
            isArchived: false,
            isStarred: true,
            tags: ['feedback', 'satisfied']
        }
    }
];

// Sample Support Tickets Data
export const supportTickets: SupportTicket[] = [
    {
        id: 'ticket-001',
        title: 'Order Delivery Delay',
        description: 'Customer reports that order ORD-2026 was supposed to be delivered yesterday but hasn\'t arrived yet.',
        priority: 'high',
        status: 'open',
        category: 'shipping',
        customer: {
            id: 'user-004',
            name: 'Emily Wilson',
            email: 'emily.w@email.com',
            avatar: 'https://i.pravatar.cc/150?img=32'
        },
        assignedTo: {
            id: 'agent-001',
            name: 'John Agent',
            avatar: 'https://i.pravatar.cc/150?img=68'
        },
        createdAt: new Date('2025-12-28T10:00:00'),
        updatedAt: new Date('2025-12-28T10:30:00'),
        messages: [
            {
                id: 'ticket-msg-001',
                text: 'I need help with my delayed order. It was supposed to be delivered yesterday.',
                timestamp: new Date('2025-12-28T10:00:00'),
                isOwn: false,
                type: 'text'
            }
        ],
        attachments: []
    },
    {
        id: 'ticket-002',
        title: 'Product Defect - Laptop Stand',
        description: 'Customer received a defective laptop stand with broken adjustment mechanism.',
        priority: 'medium',
        status: 'in_progress',
        category: 'product',
        customer: {
            id: 'user-006',
            name: 'James Smith',
            email: 'james.s@email.com',
            avatar: 'https://i.pravatar.cc/150?img=45'
        },
        createdAt: new Date('2025-12-27T14:00:00'),
        updatedAt: new Date('2025-12-27T16:30:00'),
        messages: [
            {
                id: 'ticket-msg-002',
                text: 'The laptop stand I received is broken. The adjustment mechanism doesn\'t work.',
                timestamp: new Date('2025-12-27T14:00:00'),
                isOwn: false,
                type: 'text'
            }
        ],
        attachments: ['broken-stand-photo.jpg']
    },
    {
        id: 'ticket-003',
        title: 'Billing Inquiry - Multiple Charges',
        description: 'Customer was charged twice for the same order.',
        priority: 'urgent',
        status: 'resolved',
        category: 'billing',
        customer: {
            id: 'user-007',
            name: 'Lisa Anderson',
            email: 'lisa.a@email.com',
            avatar: 'https://i.pravatar.cc/150?img=25'
        },
        assignedTo: {
            id: 'agent-002',
            name: 'Sarah Support',
            avatar: 'https://i.pravatar.cc/150?img=69'
        },
        createdAt: new Date('2025-12-26T09:00:00'),
        updatedAt: new Date('2025-12-26T11:00:00'),
        messages: [
            {
                id: 'ticket-msg-003',
                text: 'I was charged twice for my order. Can you help me get a refund?',
                timestamp: new Date('2025-12-26T09:00:00'),
                isOwn: false,
                type: 'text'
            }
        ],
        attachments: ['bank-statement.pdf']
    }
];

// this is notification data

export const notifications = [
    {
        id: 'notification-001',
        title: 'Order Shipped',
        body: 'Your order ORD-2026 has been shipped.',
        timestamp: new Date('2025-12-28T10:00:00'),
        isRead: false
    },
    {
        id: 'notification-002',
        title: 'Order Delivered',
        body: 'Your order ORD-2026 has been delivered.',
        timestamp: new Date('2025-12-28T10:15:00'),
        isRead: true
    },
    {
        id: 'notification-003',
        title: 'Order Shipped',
        body: 'Your order ORD-2027 has been shipped.',
        timestamp: new Date('2025-12-28T10:30:00'),
        isRead: false
    }
];
