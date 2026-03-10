import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, orderBy, startAfter, limit, limitToLast, endBefore, writeBatch } from 'firebase/firestore';
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
        // Create user with email and password without affecting current session
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;

        // Save staff profile to Firestore in 'staff' collection
        await setDoc(doc(db, 'staff', user.uid), {
            email: email,
            nombres: staffData.nombres || '',
            apellidos: staffData.apellidos || '',
            cargo: staffData.cargo || '',
            role: staffData.role || 'doctor', // 'admin' or 'doctor'
            telefono: staffData.telefono || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: staffData.createdBy || user.uid // who created this account
        });

        // Sign out the secondary session immediately
        await firebaseSignOut(secondaryAuth);

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

        // Check if account is active
        if (staffProfile.profile.status === 'inactive') {
            await firebaseSignOut(auth);
            return {
                user: null,
                staffProfile: null,
                error: {
                    code: 'auth/account-inactive',
                    message: 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.'
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
            return {
                profile: { uid: docSnap.id, ...docSnap.data() },
                error: null
            };
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
 * Search patients by DUI (server-side)
 * @param {string} dui - Patient DUI
 * @returns {Promise<{patients, error}>}
 */
export const getPatientsByDui = async (dui) => {
    try {
        const q = query(
            collection(db, 'users'),
            where('dui', '==', dui.trim())
        );
        const querySnapshot = await getDocs(q);
        const patients = [];
        querySnapshot.forEach((doc) => {
            patients.push({ id: doc.id, ...doc.data() });
        });
        return { patients, error: null };
    } catch (error) {
        console.error('Get patients by DUI error:', error);
        return { patients: [], error };
    }
};


/**
 * Get patients with Firestore cursor-based pagination.
 * Returns pageSize patients ordered by apellidos, starting after a cursor doc.
 * @param {number} pageSize - Number of records per page
 * @param {DocumentSnapshot|null} cursorDoc - Last doc of previous page (null for first page)
 * @param {'next'|'prev'} direction - Navigation direction
 * @param {DocumentSnapshot|null} firstDoc - First doc of current page (needed for going back)
 * @returns {Promise<{patients, firstDoc, lastDoc, hasMore, error}>}
 */
export const getPatientsPaginated = async (pageSize = 10, cursorDoc = null, direction = 'next', firstDoc = null) => {
    try {
        let q;

        if (direction === 'prev' && firstDoc) {
            // Going backwards: get pageSize records ending before firstDoc
            q = query(
                collection(db, 'users'),
                orderBy('apellidos'),
                endBefore(firstDoc),
                limitToLast(pageSize)
            );
        } else if (cursorDoc) {
            // Going forward: get pageSize records starting after cursorDoc
            q = query(
                collection(db, 'users'),
                orderBy('apellidos'),
                startAfter(cursorDoc),
                limit(pageSize)
            );
        } else {
            // First page
            q = query(
                collection(db, 'users'),
                orderBy('apellidos'),
                limit(pageSize)
            );
        }

        const querySnapshot = await getDocs(q);
        const patients = [];
        querySnapshot.forEach((doc) => {
            patients.push({ id: doc.id, ...doc.data() });
        });

        const newFirstDoc = querySnapshot.docs[0] || null;
        const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        const hasMore = querySnapshot.docs.length === pageSize;

        return { patients, firstDoc: newFirstDoc, lastDoc: newLastDoc, hasMore, error: null };
    } catch (error) {
        console.error('Error getting paginated patients:', error);
        return { patients: [], firstDoc: null, lastDoc: null, hasMore: false, error };
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

/**
 * Get full history for a patient (appointments)
 * @param {string} patientId - Patient's ID
 * @returns {Promise<{history, error}>}
 */
export const getPatientHistory = async (patientId) => {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('userId', '==', patientId)
        );

        const querySnapshot = await getDocs(q);
        const history = [];

        querySnapshot.forEach((doc) => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by date and time (most recent first)
        history.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        });

        return { history, error: null };
    } catch (error) {
        console.error('Error getting patient history:', error);
        return { history: [], error };
    }
};
/**
 * Get all staff members (admin privilege)
 * @returns {Promise<{staff, error}>}
 */
export const getAllStaffMembers = async () => {
    try {
        const staffRef = collection(db, 'staff');
        const querySnapshot = await getDocs(staffRef);

        const staff = [];
        querySnapshot.forEach((doc) => {
            staff.push({
                uid: doc.id,
                ...doc.data()
            });
        });

        return { staff, error: null };
    } catch (error) {
        console.error('Error getting all staff members:', error);
        return { staff: [], error };
    }
};

/**
 * Create a full Firestore backup from main app collections.
 * @returns {Promise<{backup: object|null, error: any}>}
 */
export const generateDatabaseBackup = async () => {
    const collectionsToBackup = ['staff', 'users', 'appointments', 'notifications'];

    try {
        const backup = {
            metadata: {
                generatedAt: new Date().toISOString(),
                collections: collectionsToBackup
            },
            collections: {}
        };

        for (const collectionName of collectionsToBackup) {
            const querySnapshot = await getDocs(collection(db, collectionName));
            backup.collections[collectionName] = querySnapshot.docs.map((docSnapshot) => ({
                id: docSnapshot.id,
                ...docSnapshot.data()
            }));
        }

        return { backup, error: null };
    } catch (error) {
        console.error('Error generating database backup:', error);
        return { backup: null, error };
    }
};

/**
 * Import a full Firestore backup replacing current data in target collections.
 * @param {object} backupData
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const importDatabaseBackup = async (backupData) => {
    const collectionsToImport = ['staff', 'users', 'appointments', 'notifications'];
    const BATCH_LIMIT = 450;

    const commitBatchOperations = async (operations) => {
        for (let index = 0; index < operations.length; index += BATCH_LIMIT) {
            const chunk = operations.slice(index, index + BATCH_LIMIT);
            const batch = writeBatch(db);

            chunk.forEach((operation) => {
                if (operation.type === 'delete') {
                    batch.delete(operation.ref);
                } else if (operation.type === 'set') {
                    batch.set(operation.ref, operation.data);
                }
            });

            await batch.commit();
        }
    };

    try {
        for (const collectionName of collectionsToImport) {
            const currentDocsSnapshot = await getDocs(collection(db, collectionName));
            const deleteOperations = currentDocsSnapshot.docs.map((docSnapshot) => ({
                type: 'delete',
                ref: doc(db, collectionName, docSnapshot.id)
            }));

            if (deleteOperations.length > 0) {
                await commitBatchOperations(deleteOperations);
            }

            const importedDocs = backupData?.collections?.[collectionName] || [];
            const setOperations = importedDocs
                .filter((item) => item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim())
                .map((item) => {
                    const { id, ...data } = item;
                    const dataToStore = collectionName === 'appointments'
                        ? { ...data, importedFromBackup: true }
                        : data;

                    return {
                        type: 'set',
                        ref: doc(db, collectionName, id),
                        data: dataToStore
                    };
                });

            if (setOperations.length > 0) {
                await commitBatchOperations(setOperations);
            }
        }

        return { success: true, error: null };
    } catch (error) {
        console.error('Error importing database backup:', error);
        return { success: false, error };
    }
};

/**
 * Delete patient profile from Firestore + Firebase Auth via secure Cloud Function.
 * @param {string} patientId
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const deletePatientProfile = async (patientId) => {
    try {
        const functions = getFunctions();
        const deletePatientAccount = httpsCallable(functions, 'deletePatientAccount');
        await deletePatientAccount({ patientId });
        return { success: true, error: null };
    } catch (error) {
        console.error('Error deleting patient profile:', error);
        return { success: false, error };
    }
};
