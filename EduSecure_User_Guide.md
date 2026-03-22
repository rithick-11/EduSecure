# EduSecure: Complete Step-by-Step User Guide

Welcome to EduSecure! This documentation explains how to use the platform step-by-step, detailing exactly what happens both in the user interface and under the hood (at the cryptographic level) during each action.

> **Sample Files Generated**: We have generated 3 sample test files for you in your `Downloads` folder:
> 1. `student_grades.csv` (Math, Science, English, etc.)
> 2. `student_gpa.csv` (Semester GPAs scaled to integers)
> 3. `research_scores.csv` (Publications, Citations, etc.)

---

## 1. Registration and Login

**What you do:**
Navigate to the Register page (`http://localhost:5173/register`) and create an account with your Email, Password, Role (e.g., Administrator), and Institution.

**What happens under the hood:**
- The frontend sends your details to the FastAPI backend (`POST /auth/register`).
- Your plaintext password is **never stored**. Instead, the backend uses `bcrypt` to generate a secure, salted hash of your password.
- A new `User` record is created in the PostgreSQL/SQLite database.
- The system automatically logs you in and generates a **JWT (JSON Web Token)**. This token is stored in your browser's local storage and attached to every subsequent request to prove your identity.

---

## 2. Generating Encryption Keys

**What you do:**
Go to the **Key Management** tab (`/keys`). Enter your password and click "Generate Keys".

**What happens under the hood:**
- The backend initializes the **Pyfhel** homomorphic encryption context with specific parameters (BFV scheme, poly modulus degree 16384, plain modulus 1032193).
- **Three keys are generated:**
  1. **Public Key**: Used to encrypt data.
  2. **Private Key**: Used to decrypt data.
  3. **Relinearization Key**: Used to reduce the size of ciphertexts after homomorphic multiplication.
- **Security Checkpoint**: Your private key is highly sensitive. The backend takes the password you just entered, generates a cryptographic salt, and uses PBKDF2 to derive an **AES-256** key.
- The Private Key is encrypted using this AES-256 key before being saved to the database. Even if the database is compromised, the attacker cannot decrypt your files without your plaintext password.

---

## 3. Uploading and Encrypting Data

**What you do:**
Go to the **Upload & Encrypt** tab (`/upload`). Drag and drop one of the sample CSVs from your `Downloads` folder (e.g., `student_grades.csv`), select a data type, and click Upload.

**What happens under the hood:**
- The CSV file is parsed by `pandas` on the backend.
- The system automatically identifies all **numeric columns** (e.g., math scores, citations). Text columns (like names) are ignored to protect personally identifiable information (PII).
- **Encryption**: Every single integer in the numeric columns is individually encrypted using your BFV **Public Key**. For a 10-row dataset with 5 subjects, this results in 50 distinct ciphertext objects.
- These ciphertexts are serialized (converted to bytes) and stored as a single encrypted blob in the `encrypted_files` database table. The plaintext CSV is immediately discarded from memory.

---

## 4. Viewing My Files

**What you do:**
Go to the **My Files** tab (`/files`) to see a list of your uploaded files.

**What happens under the hood:**
- The frontend fetches metadata from the `encrypted_files` table (`GET /files/`).
- The database returns only the metadata (filename, row count, column names, dataset size).
- The actual encrypted blobs (the ciphertext) **remain untouched** in the database until they are explicitly needed for a computation.

---

## 5. Homomorphic Computation

**What you do:**
Go to the **Compute** tab (`/compute`). Select an operation (e.g., "Addition"), select two identical-dimension files, and click "Run Computation".

**What happens under the hood:**
- The backend loads the encrypted blobs for the selected files into memory.
- It recreates the Pyfhel context using your **Public Key** and **Relinearization Key** (note: the private key is NOT used here; the data remains completely encrypted).
- **The Magic:** The BFV scheme allows the backend to perform algebraic operations directly on the ciphertexts. For example, in an addition operation, `Ciphertext(A) + Ciphertext(B) = Ciphertext(A + B)`.
- The server does not know what the numbers are, but the mathematical properties of the BFV scheme guarantee the result is correct.
- The resulting merged ciphertext is serialized and saved to the database as a new "virtual" file (a Computation Result).

---

## 6. Decrypting the Results

**What you do:**
Go to the **History** tab (`/history`). Find your recent computation, click "Decrypt", enter your password, and view the plaintext result.

**What happens under the hood:**
- You send your password and the computation ID (`POST /compute/{id}/decrypt`).
- The backend retrieves your AES-encrypted Private Key from the database.
- It derives the AES-256 key using your supplied password and the stored salt.
- It AES-decrypts your BFV Private Key. (If the password is wrong, this step fails).
- The backend loads the result ciphertext blob and uses the unlocked BFV Private Key to decrypt it.
- Finally, the server returns the plaintext array (e.g., the combined grades) back to the frontend for you to see.
- **Audit Log**: Every action (uploading, computing, decrypting) is permanently recorded in the `audit_logs` table for compliance tracking.
