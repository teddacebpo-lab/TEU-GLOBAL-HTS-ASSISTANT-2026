// services/resendService.ts

/**
 * NOTE: This is a simulated email service for demonstration purposes.
 * In a real-world application, these functions would make secure API calls 
 * to a backend service that handles sending emails via a service like Resend.
 * The API key MUST NOT be exposed on the client-side.
 */

const generateCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (email: string): Promise<string> => {
    const code = generateCode();
    console.log(`
        ============================================================
        SIMULATING EMAIL (Resend API)
        ============================================================
        TO: ${email}
        SUBJECT: Verify Your Email for TEU Global AI Assistant
        
        Hello,

        Thank you for your interest in TEU Global AI Assistant.
        Your verification code is: ${code}

        This code will expire in 10 minutes.

        ============================================================
    `);
    
    // In a real app, you would not return the code here. The user would get it from their email.
    // For this simulation, we alert it to facilitate testing.
    alert(`[SIMULATION] Verification code sent to ${email}: ${code}`);
    return code;
};

export const sendPasswordResetEmail = async (email: string): Promise<string> => {
    const code = generateCode();
    console.log(`
        ============================================================
        SIMULATING EMAIL (Resend API)
        ============================================================
        TO: ${email}
        SUBJECT: Your Password Reset Code for TEU Global AI Assistant
        
        Hello,

        We received a request to reset your password.
        Your password reset code is: ${code}

        This code will expire in 10 minutes. If you did not request a password reset,
        please ignore this email.

        ============================================================
    `);

    // In a real app, you would not return the code here. The user would get it from their email.
    // For this simulation, we alert it to facilitate testing.
    alert(`[SIMULATION] Password reset code sent to ${email}: ${code}`);
    return code;
};
