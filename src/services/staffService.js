import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

/**
 * Create a new staff profile with Firebase Auth and Firestore
 * @param {string} email - Staff member's email
 * @param {string} password - Staff member's password
 * @param {object} staffData - Additional staff data
 * @returns {Promise<{user, error}>}
 */
export const createStaffProfile = async (email, password, staffData = {}) => {
    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save staff profile to Firestore in 'staff' collection
        await setDoc(doc(db, 'staff', user.uid), {
            email: email,
            nombres: staffData.nombres || '',
            apellidos: staffData.apellidos || '',
            cargo: staffData.cargo || '',
            role: staffData.role || 'doctor', // 'admin' or 'doctor'
            telefono: staffData.telefono || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: staffData.createdBy || user.uid // who created this account
        });

        // Sign out immediately after creation (admin will create accounts for others)
        await firebaseSignOut(auth);

        return { success: true, error: null };
    } catch (error) {
        console.error('Create staff profile error:', error);
        return { success: false, error };
    }
};

/**
 * Sign in staff member and verify they exist in staff collection
 * @param {string} email - Staff member's email
 * @param {string} password - Staff member's password
 * @returns {Promise<{user, staffProfile, error}>}
 */
export const signInStaff = async (email, password) => {
    try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Verify user exists in staff collection
        const staffProfile = await getStaffProfile(user.uid);

        if (!staffProfile.profile) {
            // User is not a staff member, sign them out
            await firebaseSignOut(auth);
            return {
                user: null,
                staffProfile: null,
                error: {
                    code: 'auth/not-staff',
                    message: 'Esta cuenta no tiene permisos de personal.'
                }
            };
        }

        return {
            user: userCredential.user,
            staffProfile: staffProfile.profile,
            error: null
        };
    } catch (error) {
        console.error('Staff sign in error:', error);
        return { user: null, staffProfile: null, error };
    }
};

/**
 * Get staff profile data from Firestore
 * @param {string} userId - Staff member's ID
 * @returns {Promise<{profile, error}>}
 */
export const getStaffProfile = async (userId) => {
    try {
        const docRef = doc(db, 'staff', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { profile: docSnap.data(), error: null };
        } else {
            return { profile: null, error: new Error('Staff profile not found') };
        }
    } catch (error) {
        console.error('Get staff profile error:', error);
        return { profile: null, error };
    }
};

/**
 * Update staff profile data
 * @param {string} userId - Staff member's ID
 * @param {object} updates - Profile data to update
 * @returns {Promise<{error}>}
 */
export const updateStaffProfile = async (userId, updates) => {
    try {
        const docRef = doc(db, 'staff', userId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
        return { error: null };
    } catch (error) {
        console.error('Update staff profile error:', error);
        return { error };
    }
};

/**
 * Get all patients (admin/doctor privilege)
 * @returns {Promise<{patients, error}>}
 */
export const getAllPatients = async () => {
    try {
        const patientsRef = collection(db, 'users');
        const q = query(patientsRef);
        const querySnapshot = await getDocs(q);

        const patients = [];
        querySnapshot.forEach((doc) => {
            patients.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { patients, error: null };
    } catch (error) {
        console.error('Get all patients error:', error);
        return { patients: [], error };
    }
};

/**
 * Update patient data (admin/doctor privilege)
 * @param {string} patientId - Patient's ID
 * @param {object} updates - Data to update
 * @returns {Promise<{error}>}
 */
export const updatePatientData = async (patientId, updates) => {
    try {
        const docRef = doc(db, 'users', patientId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
        return { error: null };
    } catch (error) {
        console.error('Update patient data error:', error);
        return { error };
    }
};

/**
 * Get patient profile by ID (admin/doctor privilege)
 * @param {string} patientId - Patient's ID
 * @returns {Promise<{patient, error}>}
 */
export const getPatientById = async (patientId) => {
    try {
        const docRef = doc(db, 'users', patientId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                patient: {
                    id: docSnap.id,
                    ...docSnap.data()
                },
                error: null
            };
        } else {
            return { patient: null, error: new Error('Patient not found') };
        }
    } catch (error) {
        console.error('Get patient error:', error);
        return { patient: null, error };
    }
};
