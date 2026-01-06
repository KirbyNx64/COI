import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Create a new appointment
 * @param {string} userId - User's Firebase UID
 * @param {object} appointmentData - Appointment data
 * @returns {Promise<{appointmentId, error}>}
 */
export const createAppointment = async (userId, appointmentData) => {
    try {
        const appointment = {
            userId,
            patientName: appointmentData.patientName || '',
            date: appointmentData.date || '',
            time: appointmentData.time || '',
            reason: appointmentData.reason || '',
            clinica: appointmentData.clinica || '',
            notas: appointmentData.notas || '',
            status: appointmentData.status || 'programada',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'appointments'), appointment);
        return { appointmentId: docRef.id, error: null };
    } catch (error) {
        console.error('Error creating appointment:', error);
        return { appointmentId: null, error };
    }
};

/**
 * Get all appointments for a specific user
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<{appointments, error}>}
 */
export const getAppointmentsByUser = async (userId) => {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const appointments = [];

        querySnapshot.forEach((doc) => {
            appointments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by date and time on client side
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });

        return { appointments, error: null };
    } catch (error) {
        console.error('Error getting appointments:', error);
        return { appointments: [], error };
    }
};

/**
 * Count scheduled appointments for a specific user
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<{count, error}>}
 */
export const countScheduledAppointments = async (userId) => {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('userId', '==', userId),
            where('status', '==', 'programada')
        );

        const querySnapshot = await getDocs(q);
        return { count: querySnapshot.size, error: null };
    } catch (error) {
        console.error('Error counting scheduled appointments:', error);
        return { count: 0, error };
    }
};

/**
 * Check if user has an appointment on a specific date
 * @param {string} userId - User's Firebase UID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} excludeAppointmentId - Optional appointment ID to exclude (for edit mode)
 * @returns {Promise<{hasAppointment, error}>}
 */
export const hasAppointmentOnDate = async (userId, date, excludeAppointmentId = null) => {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('userId', '==', userId),
            where('date', '==', date),
            where('status', '==', 'programada')
        );

        const querySnapshot = await getDocs(q);

        // If excluding an appointment (edit mode), check if there are other appointments
        if (excludeAppointmentId) {
            const otherAppointments = [];
            querySnapshot.forEach((doc) => {
                if (doc.id !== excludeAppointmentId) {
                    otherAppointments.push(doc);
                }
            });
            return { hasAppointment: otherAppointments.length > 0, error: null };
        }

        return { hasAppointment: querySnapshot.size > 0, error: null };
    } catch (error) {
        console.error('Error checking appointment on date:', error);
        return { hasAppointment: false, error };
    }
};

/**
 * Listen to real-time updates for user's appointments
 * @param {string} userId - User's Firebase UID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToUserAppointments = (userId, callback) => {
    const q = query(
        collection(db, 'appointments'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
        const appointments = [];
        querySnapshot.forEach((doc) => {
            appointments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by date and time
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });

        callback(appointments);
    }, (error) => {
        console.error('Error in appointments subscription:', error);
        callback([]);
    });
};

/**
 * Update an appointment
 * @param {string} appointmentId - Appointment document ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{error}>}
 */
export const updateAppointment = async (appointmentId, updates) => {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, {
            ...updates,
            updatedAt: Timestamp.now()
        });
        return { error: null };
    } catch (error) {
        console.error('Error updating appointment:', error);
        return { error };
    }
};

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment document ID
 * @param {string} status - New status (programada, cancelada, terminada, perdida)
 * @returns {Promise<{error}>}
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
    return updateAppointment(appointmentId, { status });
};

/**
 * Delete an appointment
 * @param {string} appointmentId - Appointment document ID
 * @returns {Promise<{error}>}
 */
export const deleteAppointment = async (appointmentId) => {
    try {
        await deleteDoc(doc(db, 'appointments', appointmentId));
        return { error: null };
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return { error };
    }
};

/**
 * Get a single appointment by ID
 * @param {string} appointmentId - Appointment document ID
 * @returns {Promise<{appointment, error}>}
 */
export const getAppointmentById = async (appointmentId) => {
    try {
        const docRef = doc(db, 'appointments', appointmentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                appointment: {
                    id: docSnap.id,
                    ...docSnap.data()
                },
                error: null
            };
        } else {
            return { appointment: null, error: new Error('Appointment not found') };
        }
    } catch (error) {
        console.error('Error getting appointment:', error);
        return { appointment: null, error };
    }
};

/**
 * Mark overdue appointments as lost
 * This should be called periodically (e.g., on app load or every few minutes)
 * @returns {Promise<{updatedCount, error}>}
 */
export const markOverdueAppointmentsAsLost = async () => {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('status', '==', 'programada')
        );

        const querySnapshot = await getDocs(q);
        const now = new Date();
        let updatedCount = 0;

        const updatePromises = [];

        querySnapshot.forEach((docSnapshot) => {
            const appointment = docSnapshot.data();
            const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
            const twoHoursAfter = new Date(appointmentDateTime.getTime() + (2 * 60 * 60 * 1000));

            if (now > twoHoursAfter) {
                updatePromises.push(
                    updateAppointmentStatus(docSnapshot.id, 'perdida')
                );
                updatedCount++;
            }
        });

        await Promise.all(updatePromises);

        return { updatedCount, error: null };
    } catch (error) {
        console.error('Error marking overdue appointments:', error);
        return { updatedCount: 0, error };
    }
};

/**
 * Get count of appointments for a specific date, time, and clinic
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in format like "2:00 PM"
 * @param {string} clinica - Clinic identifier
 * @returns {Promise<{count, error}>}
 */
export const getAppointmentCountByDateTime = async (date, time, clinica) => {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('date', '==', date),
            where('time', '==', time),
            where('clinica', '==', clinica),
            where('status', '==', 'programada')
        );

        const querySnapshot = await getDocs(q);
        return { count: querySnapshot.size, error: null };
    } catch (error) {
        console.error('Error counting appointments by date/time:', error);
        return { count: 0, error };
    }
};

/**
 * Get available time slots for a specific date and clinic
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} clinica - Clinic identifier
 * @param {string} currentTime - Optional current time to include even if full (for edit mode)
 * @returns {Promise<{availableSlots, error}>}
 */
export const getAvailableTimeSlots = async (date, clinica, currentTime = null) => {
    try {
        const allTimeSlots = [
            '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
            '1:00 PM', '2:00 PM', '3:00 PM'
        ];

        // Fetch all scheduled appointments for the date and clinic
        const q = query(
            collection(db, 'appointments'),
            where('date', '==', date),
            where('clinica', '==', clinica),
            where('status', '==', 'programada')
        );

        const querySnapshot = await getDocs(q);

        // Count appointments per time slot
        const timeCounts = {};
        querySnapshot.forEach((doc) => {
            const appointment = doc.data();
            const time = appointment.time;
            timeCounts[time] = (timeCounts[time] || 0) + 1;
        });

        // Filter available slots
        const availableSlots = allTimeSlots.filter(timeSlot => {
            const count = timeCounts[timeSlot] || 0;
            // Include slot if it has less than 2 appointments, or if it's the current time in edit mode
            return count < 2 || timeSlot === currentTime;
        });

        return { availableSlots, error: null };
    } catch (error) {
        console.error('Error getting available time slots:', error);
        return { availableSlots: [], error };
    }
};

/**
 * Create appointment on behalf of a patient (staff privilege)
 * @param {string} patientId - Patient's user ID
 * @param {object} appointmentData - Appointment data
 * @param {string} staffId - Staff member's ID who is creating the appointment
 * @returns {Promise<{appointmentId, error}>}
 */
export const createAppointmentForPatient = async (patientId, appointmentData, staffId) => {
    try {
        const appointment = {
            userId: patientId,
            patientName: appointmentData.patientName || '',
            date: appointmentData.date || '',
            time: appointmentData.time || '',
            reason: appointmentData.reason || '',
            clinica: appointmentData.clinica || '',
            notas: appointmentData.notas || '',
            status: appointmentData.status || 'programada',
            createdBy: staffId, // Track who created this appointment
            createdByStaff: true, // Flag to indicate staff-created appointment
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'appointments'), appointment);
        return { appointmentId: docRef.id, error: null };
    } catch (error) {
        console.error('Error creating appointment for patient:', error);
        return { appointmentId: null, error };
    }
};

/**
 * Get all appointments (staff privilege)
 * @param {string} filterDate - Optional date filter in YYYY-MM-DD format
 * @returns {Promise<{appointments, error}>}
 */
export const getAllAppointments = async (filterDate = null) => {
    try {
        let q;
        if (filterDate) {
            q = query(
                collection(db, 'appointments'),
                where('date', '==', filterDate)
            );
        } else {
            q = query(
                collection(db, 'appointments')
            );
        }

        const querySnapshot = await getDocs(q);
        const appointments = [];

        querySnapshot.forEach((doc) => {
            appointments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by date and time (most recent first)
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        });

        return { appointments, error: null };
    } catch (error) {
        console.error('Error getting all appointments:', error);
        return { appointments: [], error };
    }
};

/**
 * Get dashboard statistics (staff privilege)
 * @returns {Promise<{stats, error}>}
 */
export const getDashboardStats = async () => {
    try {
        const appointmentsRef = collection(db, 'appointments');
        const usersRef = collection(db, 'users');

        // Get all appointments
        const appointmentsSnapshot = await getDocs(appointmentsRef);

        // Get all patients
        const usersSnapshot = await getDocs(usersRef);

        // Calculate statistics
        const today = new Date().toISOString().split('T')[0];
        let totalAppointments = 0;
        let scheduledAppointments = 0;
        let completedAppointments = 0;
        let cancelledAppointments = 0;
        let todayAppointments = 0;

        appointmentsSnapshot.forEach((doc) => {
            const appointment = doc.data();
            totalAppointments++;

            if (appointment.status === 'programada') scheduledAppointments++;
            if (appointment.status === 'terminada') completedAppointments++;
            if (appointment.status === 'cancelada') cancelledAppointments++;
            if (appointment.date === today) todayAppointments++;
        });

        const stats = {
            totalPatients: usersSnapshot.size,
            totalAppointments,
            scheduledAppointments,
            completedAppointments,
            cancelledAppointments,
            todayAppointments
        };

        return { stats, error: null };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return { stats: null, error };
    }
};

/**
 * Get today's appointments (staff privilege)
 * @returns {Promise<{appointments, error}>}
 */
export const getTodayAppointments = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collection(db, 'appointments'),
            where('date', '==', today),
            where('status', '==', 'programada')
        );

        const querySnapshot = await getDocs(q);
        const appointments = [];

        querySnapshot.forEach((doc) => {
            appointments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by time
        appointments.sort((a, b) => {
            const timeA = new Date(`1970-01-01 ${a.time}`);
            const timeB = new Date(`1970-01-01 ${b.time}`);
            return timeA - timeB;
        });

        return { appointments, error: null };
    } catch (error) {
        console.error('Error getting today appointments:', error);
        return { appointments: [], error };
    }
};

/**
 * Get appointment counts by status (staff privilege)
 * @returns {Promise<{counts, error}>}
 */
export const getAppointmentCountsByStatus = async () => {
    try {
        const appointmentsRef = collection(db, 'appointments');
        const querySnapshot = await getDocs(appointmentsRef);

        const counts = {
            programada: 0,
            terminada: 0,
            cancelada: 0,
            perdida: 0
        };

        querySnapshot.forEach((doc) => {
            const appointment = doc.data();
            if (counts.hasOwnProperty(appointment.status)) {
                counts[appointment.status]++;
            }
        });

        return { counts, error: null };
    } catch (error) {
        console.error('Error getting appointment counts:', error);
        return { counts: null, error };
    }
};

