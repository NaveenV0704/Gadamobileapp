import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import {
  signUpUser,
  signInUser,
  requestPasswordReset,
  updatePassword,
  resendforgototp,
  sendForgot,
} from "../services/userServices";
import { stripUploads } from "../lib/url";
import { generateId } from "../lib/utils-id";
import { API_BASE_URL } from "../constants/config";
import { useAuthHeader } from "@/hooks/useAuthHeader";

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    firstname: string,
    lastname: string,
    username: string,
    email: string,
    password: string,
    referralCode?: string,
  ) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => void;
  forgotpassword: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  sendOtp: (email: string) => Promise<boolean>;
  resetpassword: (
    email: string,
    otp: string,
    newPassword: string,
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Memoize headers at component level
  const headers = useAuthHeader(accessToken);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("accessToken");
      const savedUser = await AsyncStorage.getItem("UserData");

      if (savedToken) setAccessToken(savedToken);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to load auth data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    let formData = { email: email, password: password };
    // Simulate API call delay

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    try {
      const { token, user: apiUser } = await signInUser(formData, headers);

      if (token && apiUser) {
        let userdata: any = {
          id: apiUser.user_id || apiUser.id, // handle potential inconsistent naming
          firstname: apiUser.user_firstname || apiUser.firstname,
          lastname: apiUser.user_lastname || apiUser.lastname,
          username: apiUser.user_name || apiUser.username,
          email: apiUser.user_email || apiUser.email,
          profileImage:
            apiUser.user_picture || apiUser.profileImage
              ? "/uploads/" +
                stripUploads(apiUser.user_picture || apiUser.profileImage)
              : "/uploads//profile/defaultavatar.png",
          coverImage: apiUser.user_coverImage || apiUser.coverImage,
          bio: apiUser.bio || "",
          createdAt: apiUser.createdAt || "",
          friends: [],
          walletBalance:
            apiUser.user_wallet_balance || apiUser.walletBalance || "0",
          roles: apiUser.role || apiUser.roles,
          packageactive: apiUser.packageactive,
          packageName: apiUser.packageName,
        };

        setUser(userdata);
        setAccessToken(token);
        await AsyncStorage.setItem("accessToken", token);
        await AsyncStorage.setItem("UserData", JSON.stringify(userdata));
        return true;
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
    return false;
  };

  const forgotpassword = async (email: string, otp: string) => {
    let formData = { email, otp };
    try {
      const res = await requestPasswordReset(formData);
      if (res?.status) {
        console.log("Password reset instructions sent to email.");
        return true;
      }
    } catch (error) {
      console.error("Forgot password failed", error);
    }
    return false;
  };

  const resendOtp = async (email: string) => {
    let formData = { email };
    try {
      const res = await resendforgototp(formData);
      if (res?.status) {
        console.log("OTP resend to email");
        return true;
      }
    } catch (error) {
      console.error("Resend OTP failed", error);
    }
    return false;
  };

  const sendOtp = async (email: string) => {
    let formData = { email };
    try {
      const res = await sendForgot(formData);
      if (res?.status) {
        console.log("OTP send to email");
        return true;
      }
    } catch (error) {
      console.error("Send OTP failed", error);
    }
    return false;
  };

  const resetpassword = async (
    email: string,
    otp: string,
    newPassword: string,
  ) => {
    let formData = { email, otp, password: newPassword };
    try {
      const res = await updatePassword(formData);
      if (res?.status) {
        console.log("Password updated successfully.");
        return true;
      }
    } catch (error) {
      console.error("Reset password failed", error);
    }
    return false;
  };

  const register = async (
    firstname: string,
    lastname: string,
    username: string,
    email: string,
    password: string,
    referralCode: string = "",
  ) => {
    const newUser: any = {
      firstname,
      lastname,
      username,
      email,
      password,
      referral: referralCode,
    };

    let headers = { "Content-Type": "application/json" };
    try {
      const { token, user: apiUser } = await signUpUser(newUser, headers);

      // Construct user object similar to login
      let userdata: any = {
        id: apiUser.id,
        firstname: apiUser.firstname,
        lastname: apiUser.lastname,
        username: apiUser.username,
        email: apiUser.email,
        profileImage: apiUser.profileImage
          ? "/uploads/" + stripUploads(apiUser.profileImage)
          : "/uploads//profile/defaultavatar.png",
        // Add other defaults as necessary
        friends: [],
        walletBalance: "0",
        createdAt: new Date().toISOString(),
      };

      setUser(userdata);
      setAccessToken(token); // If signup returns a token, log them in
      await AsyncStorage.setItem("accessToken", token);
      await AsyncStorage.setItem("UserData", JSON.stringify(userdata));

      return true;
    } catch (error: any) {
      console.error("Login Error:", error);

      let message = "Login failed";

      try {
        // if message is JSON string → extract message field
        const parsed = JSON.parse(error.message);
        message = parsed.message || message;
      } catch {
        // if not JSON → use normal message
        message = error.message || message;
      }

      throw new Error(message);
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;

    const upda = updates.profileImage
      ? { profileImage: "/uploads/" + stripUploads(updates.profileImage) }
      : {};

    const updatedUser = { ...user, ...updates, ...upda };
    // @ts-ignore
    setUser(updatedUser);
    AsyncStorage.setItem("UserData", JSON.stringify(updatedUser));
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    await AsyncStorage.clear();
  };

  const value = {
    user,
    login,
    register,
    forgotpassword,
    resetpassword,
    resendOtp,
    sendOtp,
    updateProfile,
    logout,
    isLoading,
    accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
