import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
} from 'firebase/firestore';
import type { Classroom, ClassroomStudent, StudentClass, User } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';

const CLASS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CLASS_CODE_LENGTH = 8;
const CLASS_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
const CLASS_CODE_ATTEMPTS = 5;

class ClassServiceError extends Error {}

export function getClassErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Terjadi kesalahan saat memproses kelas.';
  }

  try {
    const details: unknown = JSON.parse(error.message);
    if (
      typeof details === 'object' &&
      details !== null &&
      'error' in details &&
      typeof details.error === 'string'
    ) {
      if (details.error.includes('Missing or insufficient permissions')) {
        return 'Akses kelas ditolak. Pastikan firestore.rules terbaru sudah diterapkan dan peran akun sudah sesuai.';
      }
      return details.error;
    }
  } catch {
    return error.message;
  }

  return error.message;
}

function createClassCode(): string {
  const randomValues = new Uint8Array(CLASS_CODE_LENGTH);
  globalThis.crypto.getRandomValues(randomValues);
  return Array.from(
    randomValues,
    (value) => CLASS_CODE_ALPHABET[value % CLASS_CODE_ALPHABET.length]
  ).join('');
}

function readTimestamp(value: unknown, fieldName: string): string {
  if (!(value instanceof Timestamp)) {
    throw new Error(`Data kelas tidak valid: ${fieldName} bukan timestamp.`);
  }
  return value.toDate().toISOString();
}

function readClassroom(code: string, data: DocumentData): Classroom {
  if (
    typeof data.name !== 'string' ||
    typeof data.teacherId !== 'string' ||
    typeof data.teacherName !== 'string'
  ) {
    throw new Error('Data kelas tidak lengkap atau tidak valid.');
  }

  return {
    code,
    name: data.name,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    createdAt: readTimestamp(data.createdAt, 'createdAt'),
  };
}

function readStudentClass(code: string, data: DocumentData): StudentClass {
  if (
    typeof data.className !== 'string' ||
    typeof data.teacherId !== 'string' ||
    typeof data.teacherName !== 'string'
  ) {
    throw new Error('Data kelas yang diikuti tidak lengkap atau tidak valid.');
  }

  return {
    code,
    name: data.className,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    joinedAt: readTimestamp(data.joinedAt, 'joinedAt'),
  };
}

function readClassroomStudent(uid: string, data: DocumentData): ClassroomStudent {
  if (typeof data.displayName !== 'string') {
    throw new Error('Data mahasiswa di kelas tidak valid.');
  }

  return {
    uid,
    displayName: data.displayName,
    joinedAt: readTimestamp(data.joinedAt, 'joinedAt'),
  };
}

function handleClassServiceError(error: unknown, operation: OperationType, path: string): never {
  if (error instanceof ClassServiceError) {
    throw error;
  }
  handleFirestoreError(error, operation, path);
}

export async function createClassroom(
  teacher: Pick<User, 'uid' | 'displayName'>,
  rawName: string
): Promise<Classroom> {
  const name = rawName.trim();
  if (name.length < 2 || name.length > 80) {
    throw new ClassServiceError('Nama kelas harus terdiri dari 2 sampai 80 karakter.');
  }

  for (let attempt = 0; attempt < CLASS_CODE_ATTEMPTS; attempt += 1) {
    const code = createClassCode();
    const classRef = doc(db, 'classes', code);

    try {
      const created = await runTransaction(db, async (transaction) => {
        const classSnapshot = await transaction.get(classRef);
        if (classSnapshot.exists()) {
          return false;
        }

        transaction.set(classRef, {
          name,
          teacherId: teacher.uid,
          teacherName: teacher.displayName,
          createdAt: serverTimestamp(),
        });
        return true;
      });

      if (created) {
        return {
          code,
          name,
          teacherId: teacher.uid,
          teacherName: teacher.displayName,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error: unknown) {
      handleClassServiceError(error, OperationType.CREATE, `classes/${code}`);
    }
  }

  throw new ClassServiceError('Gagal membuat kode kelas unik. Silakan coba lagi.');
}

export async function listTeacherClasses(teacherId: string): Promise<Classroom[]> {
  const path = 'classes';
  try {
    const classQuery = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
    const snapshots = await getDocs(classQuery);
    return snapshots.docs
      .map((snapshot) => readClassroom(snapshot.id, snapshot.data()))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listStudentClasses(studentId: string): Promise<StudentClass[]> {
  const path = `users/${studentId}/classes`;
  try {
    const snapshots = await getDocs(collection(db, 'users', studentId, 'classes'));
    return snapshots.docs
      .map((snapshot) => readStudentClass(snapshot.id, snapshot.data()))
      .sort((left, right) => right.joinedAt.localeCompare(left.joinedAt));
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listClassroomStudents(classCode: string): Promise<ClassroomStudent[]> {
  const path = `classes/${classCode}/students`;
  try {
    const snapshots = await getDocs(collection(db, 'classes', classCode, 'students'));
    return snapshots.docs
      .map((snapshot) => readClassroomStudent(snapshot.id, snapshot.data()))
      .sort((left, right) => left.displayName.localeCompare(right.displayName));
  } catch (error: unknown) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function joinClassroomWithCode(
  student: Pick<User, 'uid' | 'displayName'>,
  rawCode: string
): Promise<StudentClass> {
  const code = rawCode.trim().toUpperCase();
  if (!CLASS_CODE_PATTERN.test(code)) {
    throw new ClassServiceError('Kode kelas harus terdiri dari 8 huruf atau angka yang valid.');
  }

  const classRef = doc(db, 'classes', code);
  const studentClassRef = doc(db, 'users', student.uid, 'classes', code);
  const classroomStudentRef = doc(db, 'classes', code, 'students', student.uid);
  const path = `classes/${code}`;

  try {
    return await runTransaction(db, async (transaction) => {
      const [classSnapshot, studentClassSnapshot, rosterSnapshot] = await Promise.all([
        transaction.get(classRef),
        transaction.get(studentClassRef),
        transaction.get(classroomStudentRef),
      ]);

      if (!classSnapshot.exists()) {
        throw new ClassServiceError('Kode kelas tidak ditemukan. Periksa kembali kodenya.');
      }
      if (studentClassSnapshot.exists() || rosterSnapshot.exists()) {
        throw new ClassServiceError('Anda sudah tergabung di kelas ini.');
      }

      const classroom = readClassroom(code, classSnapshot.data());
      const joinedAt = serverTimestamp();

      transaction.set(studentClassRef, {
        classCode: code,
        className: classroom.name,
        teacherId: classroom.teacherId,
        teacherName: classroom.teacherName,
        joinedAt,
      });
      transaction.set(classroomStudentRef, {
        uid: student.uid,
        displayName: student.displayName,
        joinedAt,
      });

      return {
        code,
        name: classroom.name,
        teacherId: classroom.teacherId,
        teacherName: classroom.teacherName,
        joinedAt: new Date().toISOString(),
      };
    });
  } catch (error: unknown) {
    handleClassServiceError(error, OperationType.WRITE, path);
  }
}
