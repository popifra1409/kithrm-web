import { useEffect, useRef, useState } from 'react';
import { fetchProfile, updateProfile, uploadProfilePhoto } from '../api/profile';
import type { EmployeeProfile } from '../api/profile';
import { changePassword } from '../api/auth';
import { extractApiError } from '../api/client';

export default function ProfilePage() {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setIsLoading(true);
        try {
            const data = await fetchProfile();
            setProfile(data);
            setPhone(data.phone ?? '');
            setEmail(data.email ?? '');
            setAddress(data.address ?? '');
            setCity(data.city ?? '');
        } catch (error) {
            alert(extractApiError(error).message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingPhoto(true);
        try {
            await uploadProfilePhoto(file);
            await load();
        } catch (error) {
            alert(extractApiError(error).message);
        } finally {
            setIsUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleSave() {
        setErrorMessage(null);
        setIsSaving(true);

        try {
            const updated = await updateProfile({ phone, email, address, city });
            setProfile(updated);
            setIsEditing(false);
        } catch (error) {
            setErrorMessage(extractApiError(error).message);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleChangePassword() {
        setPasswordError(null);
        setPasswordSuccess(false);

        if (!currentPassword || !newPassword || !newPasswordConfirmation) {
            setPasswordError('Veuillez remplir tous les champs.');
            return;
        }
        if (newPassword !== newPasswordConfirmation) {
            setPasswordError('Les deux nouveaux mots de passe ne correspondent pas.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        setIsSavingPassword(true);

        try {
            await changePassword({
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: newPasswordConfirmation,
            });
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirmation('');
            setIsChangingPassword(false);
        } catch (error) {
            setPasswordError(extractApiError(error).message);
        } finally {
            setIsSavingPassword(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-10">
                <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return <div className="p-10 text-gray-500">Impossible de charger le profil.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <div className="flex flex-col items-center mb-8">
                <div className="relative">
                    {profile.photo_url ? (
                        <img src={profile.photo_url} alt="" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-3xl font-bold">
                            {profile.full_name.charAt(0)}
                        </div>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1e3a5f] border-2 border-white flex items-center justify-center text-white text-xs hover:opacity-90"
                        title="Changer la photo"
                    >
                        {isUploadingPhoto ? '…' : '✏️'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                    />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mt-3">{profile.full_name}</h1>
                <p className="text-sm text-gray-500">{profile.matricule}</p>
            </div>

            <Section title="Affectation">
                <InfoRow label="Corps de métier" value={profile.trade_body} />
                <InfoRow label="Qualification" value={profile.qualification} />
                <InfoRow label="Poste" value={profile.job_title} />
                <InfoRow label="Service" value={profile.service ?? profile.department} />
                <InfoRow label="Statut" value={profile.administrative_status_label} />
            </Section>

            <Section
                title="Coordonnées"
                action={
                    !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-[#1e3a5f] hover:underline">
                            Modifier
                        </button>
                    )
                }
            >
                {isEditing ? (
                    <div className="space-y-4">
                        <Field label="Téléphone" value={phone} onChange={setPhone} type="tel" />
                        <Field label="Email" value={email} onChange={setEmail} type="email" />
                        <Field label="Adresse" value={address} onChange={setAddress} />
                        <Field label="Ville" value={city} onChange={setCity} />

                        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setPhone(profile.phone ?? '');
                                    setEmail(profile.email ?? '');
                                    setAddress(profile.address ?? '');
                                    setCity(profile.city ?? '');
                                    setErrorMessage(null);
                                }}
                                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                            >
                                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <InfoRow label="Téléphone" value={profile.phone} />
                        <InfoRow label="Email" value={profile.email} />
                        <InfoRow label="Adresse" value={profile.address} />
                        <InfoRow label="Ville" value={profile.city} />
                    </>
                )}
            </Section>

            <Section
                title="Sécurité"
                action={
                    !isChangingPassword && (
                        <button
                            onClick={() => {
                                setIsChangingPassword(true);
                                setPasswordSuccess(false);
                            }}
                            className="text-sm font-semibold text-[#1e3a5f] hover:underline"
                        >
                            Changer le mot de passe
                        </button>
                    )
                }
            >
                {isChangingPassword ? (
                    <div className="space-y-4">
                        <Field label="Mot de passe actuel" value={currentPassword} onChange={setCurrentPassword} type="password" />
                        <Field label="Nouveau mot de passe" value={newPassword} onChange={setNewPassword} type="password" />
                        <Field
                            label="Confirmer le nouveau mot de passe"
                            value={newPasswordConfirmation}
                            onChange={setNewPasswordConfirmation}
                            type="password"
                        />

                        {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setIsChangingPassword(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setNewPasswordConfirmation('');
                                    setPasswordError(null);
                                }}
                                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={isSavingPassword}
                                className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                            >
                                {isSavingPassword ? 'Enregistrement...' : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {passwordSuccess && (
                            <p className="text-sm text-green-700 mb-2">✅ Mot de passe modifié avec succès.</p>
                        )}
                        <p className="text-sm text-gray-500">••••••••</p>
                    </>
                )}
            </Section>
        </div>
    );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#1e3a5f]">{title}</h2>
                {action}
            </div>
            {children}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
        </div>
    );
}