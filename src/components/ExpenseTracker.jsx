import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/api';

export default function ExpenseTracker() {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState({
        totalSpent: 0,
        shopWiseSpending: [],
        monthlySpending: {},
        recentTransactions: [],
    });
    const [timeframe, setTimeframe] = useState('all'); // all, year, month, week

    useEffect(() => {
        loadExpenses();
    }, [user, timeframe]);

    const loadExpenses = async () => {
        try {
            setLoading(true);

            // ✅ Get user from context or localStorage fallback
            let currentUser = user;
            if (!currentUser?._id) {
                const stored = localStorage.getItem("user");
                if (stored) currentUser = JSON.parse(stored);
            }

            if (!currentUser?._id) {
                console.error("❌ No user ID found; cannot load expenses");
                return;
            }

            const userId = currentUser._id;
            console.log(`🔍 Loading expenses for user ID: ${userId} with timeframe: ${timeframe}`);
            // ✅ Call backend with userId as fallback
            const ordersRes = await api.get(`/orders?customerId=${userId}`);
            let userOrders = ordersRes.data || [];

            userOrders = userOrders.filter(
                (order) => order.customerId?._id === userId || order.customerId === userId
            );

            const pantryRes = await api.get(`/pantry/user/${userId}`);
            const userRefills = (pantryRes.data || []).filter(item =>
                ['REFILL_REQUESTED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(item.status) ||
                (item.status === 'STOCKED' && item.lastRefilled)
            );

            // Combine orders and refills for total spending analysis
            const allTransactions = [
                ...userOrders.map(o => {
                    // Calculate total from items if totalAmount is not present
                    let amount = o.totalAmount;
                    if (!amount && Array.isArray(o.items)) {
                        amount = o.items.reduce((sum, item) =>
                            sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0
                        );
                    }

                    // Try to get shop name from shopId object if present
                    let shopName = o.shopName;
                    if (!shopName && o.shopId && typeof o.shopId === 'object') {
                        shopName = o.shopId.name;
                    }

                    console.log('Processing order:', {
                        orderId: o._id,
                        amount,
                        shopName,
                        items: o.items
                    });

                    return {
                        type: 'order',
                        amount: amount || 0,
                        date: new Date(o.orderDate),
                        shopId: typeof o.shopId === 'object' ? o.shopId._id : o.shopId,
                        shopName: shopName || 'Unknown Shop',
                        items: o.items || [],
                    };
                }),
                ...userRefills.map(r => {
                    // Only count the cost if refill was delivered or is in progress
                    const shouldCountCost = r.status === 'DELIVERED' ||
                        (r.status === 'STOCKED' && r.lastRefilled) ||
                        ['CONFIRMED', 'OUT_FOR_DELIVERY'].includes(r.status);

                    const amount = shouldCountCost ? (Number(r.price) || 0) * (Number(r.packsOwned) || 0) : 0;

                    console.log('Processing refill:', {
                        refillId: r._id,
                        status: r.status,
                        price: r.price,
                        packsOwned: r.packsOwned,
                        shouldCountCost,
                        calculatedAmount: amount
                    });

                    let shopName = r.shop?.name;
                    if (!shopName && r.shopId && typeof r.shopId === 'object') {
                        shopName = r.shopId.name;
                    }

                    return {
                        type: 'refill',
                        amount,
                        date: new Date(r.updatedAt || Date.now()),
                        shopId: r.shop?._id || r.shopId,
                        shopName: shopName || 'Unknown Shop',
                        items: [{
                            productName: r.productName || r.product?.name || 'Unknown Product',
                            quantity: r.packsOwned,
                            price: r.price
                        }],
                    };
                })
            ].sort((a, b) => b.date - a.date);

            console.log('All transactions before filtering:', allTransactions);

            // Filter by timeframe
            const now = new Date();
            const filteredTransactions = allTransactions.filter(t => {
                if (timeframe === 'week') {
                    return now - t.date <= 7 * 24 * 60 * 60 * 1000;
                } else if (timeframe === 'month') {
                    return now - t.date <= 30 * 24 * 60 * 60 * 1000;
                } else if (timeframe === 'year') {
                    return now - t.date <= 365 * 24 * 60 * 60 * 1000;
                }
                return true; // 'all' timeframe
            });

            // Calculate total spent
            const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

            // Calculate shop-wise spending
            const shopSpending = filteredTransactions.reduce((acc, t) => {
                // Normalize shop ID to handle both string and object IDs
                const shopId = typeof t.shopId === 'object' ? t.shopId._id : t.shopId;
                const key = shopId || 'unknown';

                // If this shop already exists, update its values
                if (acc[key]) {
                    acc[key].total += t.amount;
                    acc[key][t.type === 'order' ? 'orders' : 'refills']++;
                    // Keep the most recent shop name if it changed
                    if (t.shopName) {
                        acc[key].shopName = t.shopName;
                    }
                } else {
                    // Create new shop entry
                    acc[key] = {
                        shopId: shopId,
                        shopName: t.shopName,
                        total: t.amount,
                        orders: t.type === 'order' ? 1 : 0,
                        refills: t.type === 'refill' ? 1 : 0
                    };
                }
                return acc;
            }, {});

            // Convert to array and sort by total spent
            const shopWiseSpending = Object.values(shopSpending)
                .sort((a, b) => b.total - a.total);

            // Calculate monthly spending
            const monthlySpending = filteredTransactions.reduce((acc, t) => {
                const monthYear = t.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                acc[monthYear] = (acc[monthYear] || 0) + t.amount;
                return acc;
            }, {});

            setExpenses({
                totalSpent,
                shopWiseSpending,
                monthlySpending,
                recentTransactions: filteredTransactions.slice(0, 10),
            });
        } catch (err) {
            console.error('Error loading expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading expense data...</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>Expense Tracker</h2>
                <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    style={styles.timeframeSelect}
                >
                    <option value="all">All Time</option>
                    <option value="year">Past Year</option>
                    <option value="month">Past Month</option>
                    <option value="week">Past Week</option>
                </select>
            </div>

            <div style={styles.overviewCard}>
                <h3>Total Spent</h3>
                <p style={styles.totalAmount}>₹{expenses.totalSpent.toFixed(2)}</p>
            </div>

            <div style={styles.grid}>
                {/* Shop-wise Spending */}
                <div style={styles.card}>
                    <h3>Spending by Shop</h3>
                    <div style={styles.shopList}>
                        {expenses.shopWiseSpending.map(shop => {
                            const totalTransactions = shop.orders + shop.refills;
                            const transactionText = [];
                            if (shop.orders > 0) transactionText.push(`${shop.orders} order${shop.orders > 1 ? 's' : ''}`);
                            if (shop.refills > 0) transactionText.push(`${shop.refills} refill${shop.refills > 1 ? 's' : ''}`);

                            return (
                                <div key={shop.shopId} style={styles.shopItem}>
                                    <div style={styles.shopHeader}>
                                        <h4>{shop.shopName}</h4>
                                        <span style={styles.shopTotal}>₹{shop.total.toFixed(2)}</span>
                                    </div>
                                    <div style={styles.shopStats}>
                                        <small>{totalTransactions} transaction{totalTransactions > 1 ? 's' : ''} ({transactionText.join(' & ')})</small>
                                        <div style={styles.progressBar}>
                                            <div
                                                style={{
                                                    ...styles.progressFill,
                                                    width: `${(shop.total / expenses.totalSpent * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Monthly Spending */}
                <div style={styles.card}>
                    <h3>Monthly Spending</h3>
                    <div style={styles.monthList}>
                        {Object.entries(expenses.monthlySpending)
                            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                            .map(([month, amount]) => (
                                <div key={month} style={styles.monthItem}>
                                    <span>{month}</span>
                                    <span style={styles.monthAmount}>₹{amount.toFixed(2)}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div style={styles.card}>
                <h3>Recent Transactions</h3>
                <div style={styles.transactionList}>
                    {expenses.recentTransactions.map((t, idx) => (
                        <div key={idx} style={styles.transactionItem}>
                            <div style={styles.transactionHeader}>
                                <div>
                                    <span style={styles.transactionType}>
                                        {t.type === 'order' ? '🛒 Order' : '🔄 Refill'}
                                    </span>
                                    <span style={styles.transactionShop}>{t.shopName}</span>
                                </div>
                                <span style={styles.transactionAmount}>₹{t.amount.toFixed(2)}</span>
                            </div>
                            <div style={styles.transactionDetails}>
                                <small style={styles.transactionDate}>
                                    {t.date.toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </small>
                                <small>{t.items.length} items</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    timeframeSelect: {
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#fff',
        fontSize: '14px',
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#666',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        border: '1px solid #edf2f7',
    },
    overviewCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
        color: '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    totalAmount: {
        fontSize: '36px',
        fontWeight: '700',
        margin: '12px 0',
    },
    shopList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    shopItem: {
        padding: '12px 0',
        borderBottom: '1px solid #edf2f7',
    },
    shopHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    shopTotal: {
        fontWeight: '600',
        color: '#2563eb',
    },
    shopStats: {
        color: '#64748b',
    },
    progressBar: {
        height: '4px',
        backgroundColor: '#f1f5f9',
        borderRadius: '2px',
        marginTop: '8px',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: '2px',
        transition: 'width 0.3s ease',
    },
    monthList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    monthItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #edf2f7',
    },
    monthAmount: {
        fontWeight: '600',
        color: '#2563eb',
    },
    transactionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    transactionItem: {
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
    },
    transactionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
    },
    transactionType: {
        backgroundColor: '#e0e7ff',
        color: '#4f46e5',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        marginRight: '8px',
    },
    transactionShop: {
        color: '#1e293b',
    },
    transactionAmount: {
        fontWeight: '600',
        color: '#2563eb',
    },
    transactionDetails: {
        display: 'flex',
        justifyContent: 'space-between',
        color: '#64748b',
        fontSize: '12px',
    },
    transactionDate: {
        color: '#94a3b8',
    },
};