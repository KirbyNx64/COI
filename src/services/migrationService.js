import { createAppointment } from './appointmentService';

/**
 * Migrate appointments from localStorage to Firebase
 * This should be called once per user after they log in
 * @param {string} userId - User's Firebase UID
 * @param {object} userData - User's profile data
 * @returns {Promise<{migratedCount, error}>}
 */
export const migrateLocalStorageToFirebase = async (userId, userData) => {
    try {
        // Check if migration has already been done
        const migrationKey = `appointments_migrated_${userId}`;
        const alreadyMigrated = localStorage.getItem(migrationKey);

        if (alreadyMigrated === 'true') {
            console.log('Appointments already migrated for this user');
            return { migratedCount: 0, error: null };
        }

        // Get appointments from localStorage
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');

        if (appointments.length === 0) {
            // Mark as migrated even if there are no appointments
            localStorage.setItem(migrationKey, 'true');
            return { migratedCount: 0, error: null };
        }

        console.log(`Migrating ${appointments.length} appointments to Firebase...`);

        // Prepare patient name
        const patientName = userData ? `${userData.nombres || ''} ${userData.apellidos || ''}`.trim() : 'Paciente';

        // Migrate each appointment
        const migrationPromises = appointments.map(apt => {
            const appointmentData = {
                patientName: apt.patientName || patientName,
                date: apt.date,
                time: apt.time,
                reason: apt.reason,
                clinica: apt.clinica,
                notas: apt.notas || '',
                status: apt.status || 'programada'
            };

            return createAppointment(userId, appointmentData);
        });

        const results = await Promise.all(migrationPromises);

        // Count successful migrations
        const migratedCount = results.filter(r => !r.error).length;
        const failedCount = results.filter(r => r.error).length;

        if (failedCount > 0) {
            console.warn(`${failedCount} appointments failed to migrate`);
        }

        // Mark migration as complete
        localStorage.setItem(migrationKey, 'true');

        // Optionally, clear old appointments from localStorage
        // localStorage.removeItem('appointments');

        console.log(`Successfully migrated ${migratedCount} appointments to Firebase`);

        return { migratedCount, error: null };
    } catch (error) {
        console.error('Error migrating appointments:', error);
        return { migratedCount: 0, error };
    }
};
