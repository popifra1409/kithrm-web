import { useRef, useState } from 'react';

interface Props {
    label: string;
    file: File | null;
    onChange: (file: File | null) => void;
    required?: boolean;
}

export default function PhotoCaptureInput({ label, file, onChange, required }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const previewUrl = file ? URL.createObjectURL(file) : null;

    async function openCamera() {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            setIsCameraOpen(true);
            // Le <video> n'est monté qu'après le rendu ; on attend le prochain tick.
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 0);
        } catch {
            setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.");
        }
    }

    function closeCamera() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsCameraOpen(false);
    }

    function capturePhoto() {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                onChange(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
            }
            closeCamera();
        }, 'image/jpeg', 0.9);
    }

    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
                {label} {required && '*'}
            </label>

            {isCameraOpen ? (
                <div className="rounded-lg overflow-hidden border border-gray-300">
                    <video ref={videoRef} autoPlay playsInline className="w-full bg-black" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-2 p-2 bg-gray-50">
                        <button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-xs font-semibold"
                        >
                            📸 Capturer
                        </button>
                        <button
                            type="button"
                            onClick={closeCamera}
                            className="flex-1 border border-gray-300 rounded-lg py-2 text-xs font-medium text-gray-700"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    {previewUrl ? (
                        <img src={previewUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-gray-300" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 text-xl">
                            👤
                        </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            📁 Choisir un fichier
                        </button>
                        <button
                            type="button"
                            onClick={openCamera}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            📷 Utiliser la caméra
                        </button>
                        {file && (
                            <button
                                type="button"
                                onClick={() => onChange(null)}
                                className="text-xs font-medium text-red-600 hover:underline px-1"
                            >
                                Retirer
                            </button>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                        className="hidden"
                    />
                </div>
            )}

            {cameraError && <p className="text-xs text-red-600 mt-1">{cameraError}</p>}
        </div>
    );
}