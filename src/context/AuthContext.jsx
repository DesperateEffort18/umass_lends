import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";
import { checkBruteForce, recordFailedLogin, resetFailedLogin } from "../utils/bruteForceProtection";

const AuthContext = createContext()

export const AuthContextProvider = ({children}) => {
    const [session, setSession] = useState(undefined);

    //Sign up
    const signUpNewUser = async ( email, password) =>{
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        if(error){
        console.error("there was a problem signing up:", error);
        return { success: false, error};
    }
    return { success: true, data };
    };

    //Sign in
    const signInUser = async ( email, password ) => {
        const emailLower = email.toLowerCase().trim();
        
        try {
            // Check for brute force protection BEFORE attempting login
            const bruteForceCheck = await checkBruteForce(emailLower);
            
            if (bruteForceCheck.blocked) {
                return { 
                    success: false, 
                    error: "Too many failed login attempts. Please try again in 15 minutes.",
                    bruteForceBlocked: true
                };
            }

            // Attempt login
            const {data, error} = await supabase.auth.signInWithPassword({
                email: emailLower,
                password: password,
            });
            
            if(error){
                // Record failed login attempt
                await recordFailedLogin(emailLower);
                console.error("sign in error occured: ", error);
                return { success: false, error: error.message };
            }
            
            // Reset failed login attempts on successful login
            await resetFailedLogin(emailLower);
            console.log("sign-in success");
            return { success: true, data};
        } catch(error){
            // Record failed login attempt on exception
            await recordFailedLogin(emailLower);
            console.error("An error occured: ", error.message);
            return {
                success: false,
                error: "An unexpected error occurred. Please try again.",
            };
        }

    };

    useEffect(() => {
        supabase.auth.getSession().then(({data: { session } }) => {
            setSession(session);
        });
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    },[]);

    // Sign out
    async function signOut() {
        const { error } =  await supabase.auth.signOut();
        if(error){
            console.error("there was an error: ", error);
        }
    }


    return(
        <AuthContext.Provider value={{session, signUpNewUser, signInUser, signOut}}>
            {children}
        </AuthContext.Provider>
    );
};

export const UserAuth = () => {
    return useContext(AuthContext);
};
