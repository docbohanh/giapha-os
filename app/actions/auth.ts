"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateProfile(formData: FormData) {
    try {
        const displayName = formData.get("displayName")?.toString();

        if (!displayName) {
            return { error: "Tên hiển thị không được để trống." };
        }

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.auth.updateUser({
            data: { display_name: displayName },
        });

        if (error) {
            return { error: error.message };
        }

        revalidatePath("/dashboard/profile");
        return { success: true };
    } catch (err: any) {
        console.error("updateProfile error:", err);
        return { error: "Đã có lỗi xảy ra khi cập nhật hồ sơ." };
    }
}

export async function updatePassword(formData: FormData) {
    try {
        const password = formData.get("password")?.toString();
        const confirmPassword = formData.get("confirmPassword")?.toString();

        if (!password || !confirmPassword) {
            return { error: "Mật khẩu không được để trống." };
        }

        if (password !== confirmPassword) {
            return { error: "Mật khẩu xác nhận không khớp." };
        }

        // Password policy validation: 8+ chars, upper, lower, digit, special
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!regex.test(password)) {
            return {
                error:
                    "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
            };
        }

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            return { error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("updatePassword error:", err);
        return { error: "Đã có lỗi xảy ra khi đổi mật khẩu." };
    }
}
