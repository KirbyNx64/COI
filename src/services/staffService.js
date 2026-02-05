import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query } from 'firebase/firestore';
import { auth, db, secondaryAuth } from '../firebaseConfig';

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

/**
 * Generate a secure temporary password
 * @returns {string} Temporary password
 */
const generateTempPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Create a new patient with temporary password and send password reset email
 * @param {object} patientData - Patient information
 * @param {string} createdBy - UID of staff member creating the patient
 * @returns {Promise<{success, patient, error}>}
 */
export const createPatientWithTempPassword = async (patientData, createdBy) => {
    try {
        // Validate required fields
        if (!patientData.email || !patientData.nombres || !patientData.apellidos) {
            return {
                success: false,
                patient: null,
                error: new Error('Email, nombres y apellidos son requeridos')
            };
        }

        // Save current staff user before creating new patient
        const currentStaffUser = auth.currentUser;
        if (!currentStaffUser) {
            return {
                success: false,
                patient: null,
                error: new Error('No hay sesión de staff activa')
            };
        }

        // Generate temporary password
        const tempPassword = generateTempPassword();

        // Create user with email and temporary password using SECONDARY auth
        // This prevents logging out the current staff user
        const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            patientData.email,
            tempPassword
        );
        const newPatientUser = userCredential.user;

        console.log('Patient user created in Auth:', newPatientUser.uid);

        // Save patient profile to Firestore
        try {
            console.log('Attempting to save patient data to Firestore...');
            await setDoc(doc(db, 'users', newPatientUser.uid), {
                email: patientData.email,
                nombres: patientData.nombres || '',
                apellidos: patientData.apellidos || '',
                fechaNacimiento: patientData.fechaNacimiento || null,
                dui: patientData.dui || '',
                genero: patientData.genero || '',
                direccion: patientData.direccion || '',
                telefono: patientData.telefono || '',
                emergenciaNombre: patientData.emergenciaNombre || '',
                emergenciaTelefono: patientData.emergenciaTelefono || '',
                emergenciaParentesco: patientData.emergenciaParentesco || '',
                tipoPaciente: patientData.tipoPaciente || 'primera-vez',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: createdBy // Track who created this patient
            });
            console.log('Patient data saved successfully to Firestore');
        } catch (firestoreError) {
            console.error('Firestore save error:', firestoreError);
            console.error('Error code:', firestoreError.code);
            console.error('Error message:', firestoreError.message);

            // Clean up: delete the auth user if Firestore save fails
            try {
                await newPatientUser.delete();
                console.log('Cleaned up auth user after Firestore failure');
            } catch (deleteError) {
                console.error('Failed to clean up auth user:', deleteError);
            }

            throw new Error(`Error al guardar datos del paciente: ${firestoreError.message}`);
        }

        // Send password reset email so patient can set their own password
        await sendPasswordResetEmail(secondaryAuth, patientData.email);

        // Sign out from secondary auth (doesn't affect primary staff session)
        await firebaseSignOut(secondaryAuth);

        return {
            success: true,
            patient: {
                id: newPatientUser.uid,
                email: patientData.email,
                nombres: patientData.nombres,
                apellidos: patientData.apellidos
            },
            error: null
        };
    } catch (error) {
        console.error('Create patient with temp password error:', error);

        // Provide user-friendly error messages
        let errorMessage = 'Error al crear el paciente';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este correo electrónico ya está registrado';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El correo electrónico no es válido';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es muy débil';
        }

        return {
            success: false,
            patient: null,
            error: { ...error, message: errorMessage }
        };
    }
};
