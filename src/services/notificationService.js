import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    doc,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Create a new notification for a user
 * @param {string} userId - Target user's UID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'info', 'success', 'warning', 'error'
 * @param {string} link - Optional link to navigate to
 * @returns {Promise<{visitId, error}>}
 */
export const createNotification = async (userId, title, message, type = 'info', link = null) => {
    try {
        const notification = {
            userId,
            title,
            message,
            type,
            link,
            read: false,
            createdAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'notifications'), notification);
        return { id: docRef.id, error: null };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { id: null, error };
    }
};

/**
 * Get notifications for a user
 * @param {string} userId - User's UID
 * @param {number} limitCount - Max number of notifications to fetch
 * @returns {Promise<{notifications, error}>}
 */
export const getUserNotifications = async (userId, limitCount = 20) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId)
            // Removed orderBy to avoid index requirements
        );

        const querySnapshot = await getDocs(q);
        const notifications = [];

        querySnapshot.forEach((doc) => {
            notifications.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Client-side sort
        notifications.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        return { notifications: notifications.slice(0, limitCount), error: null };
    } catch (error) {
        console.error('Error getting notifications:', error);
        return { notifications: [], error };
    }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{error}>}
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true
        });
        return { error: null };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { error };
    }
};

/**
 * Subscribe to user's unread notifications count or list
 * @param {string} userId - User's UID
 * @param {function} callback - Callback function
 * @returns {function} Unsubscribe function
 */
export const subscribeToUserNotifications = (userId, callback) => {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
        // Removed orderBy to avoid index requirements
    );

    return onSnapshot(q, (querySnapshot) => {
        const notifications = [];
        let unreadCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                ...data
            });
            if (!data.read) {
                unreadCount++;
            }
        });

        // Client-side sort
        notifications.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        // Limit to latest 20
        const limitedNotifications = notifications.slice(0, 20);

        callback({ notifications: limitedNotifications, unreadCount });
    }, (error) => {
        console.error('Error subscribing to notifications:', error);
        callback({ notifications: [], unreadCount: 0 });
    });
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User's UID
 * @returns {Promise<{error}>}
 */
export const markAllNotificationsAsRead = async (userId) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        const batchPromises = [];

        querySnapshot.forEach((docSnapshot) => {
            const docRef = doc(db, 'notifications', docSnapshot.id);
            batchPromises.push(updateDoc(docRef, { read: true }));
        });

        await Promise.all(batchPromises);
        return { error: null };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return { error };
    }
};
