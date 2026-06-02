import { UserSetting } from "../components/settings/UserSetting"
import { useAuth } from "../context/AuthContext";
import { AdminSetting } from "../components/settings/AdminSetting";




export function SettingPage() {
    const { user} =useAuth();
    return (
        <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-5 overflow-hidden p-4 md:p-6">
            {/* <UserSetting user={user}/> */}
            <AdminSetting user={user} />
        </div>
    )
}   