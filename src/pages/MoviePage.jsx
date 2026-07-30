import { useParams } from "react-router";
import TopPageTwo from "../components/base/TopPageTwo";
import { useContext, useEffect, useState } from "react";
import JuryMoviePanel from "../components/admin/JuryMoviePanel";
import { AuthContext } from "../context/AuthContext";

function MoviePage() {
    const { idSlug } = useParams();
    const id = idSlug?.split('-')[0];

    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isJury } = useContext(AuthContext);

    useEffect(() => {
        if (!id || isNaN(Number(id))) {
            setError("Film introuvable.");
            setIsLoading(false);
            return;
        }
        async function getMovieData() {
            try {
                const res = await fetch(import.meta.env.VITE_SERVER_ADDRESS + '/movies/' + id, { method: 'GET' });
                const json = await res.json();
                if (res.ok) {
                    setData(json);
                } else {
                    setError(json.message || 'Erreur lors de la récupération des données.');
                }
            } catch (e) {
                console.error('error: ', e);
                setError('Impossible de se connecter au serveur.');
            } finally {
                setIsLoading(false);
            }
        }
        getMovieData();
    }, [id]);

    const basePageClasses = "min-h-screen bg-gray-900 text-gray-100";

    if (isLoading) {
        return (
            <div className={`${basePageClasses} flex justify-center items-center`}>
                <p className="text-xl text-gray-400">Chargement...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={`${basePageClasses} flex justify-center items-center`}>
                <p className="text-xl text-red-500">{error || "Le film demandé n'a pas été trouvé."}</p>
            </div>
        );
    }

    const director = data.director;

    return (
        <div className={basePageClasses}>
            <TopPageTwo />

            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-white">{data.english_title}</h1>
                    {data.original_title !== data.english_title && (
                        <h2 className="text-lg text-gray-400">{data.original_title}</h2>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-400 pt-1">
                        <span className="text-white font-semibold">{data.duration} s</span>
                        <span>•</span>
                        <span className={data.is_hybrid ? "text-blue-400 font-semibold" : "text-purple-400 font-semibold"}>
                            {data.is_hybrid ? "Hybrid" : "100% AI"}
                        </span>
                        <span>•</span>
                        <span>{data.language}</span>
                        {data.has_subs && (
                            <>
                                <span>•</span>
                                <span className="text-green-400">Sous-titres</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Video */}
                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                    <video
                        src={data.video_path}
                        controls
                        poster={data.cover_path}
                        className="w-full h-full object-contain"
                    >
                        Votre navigateur ne supporte pas la balise vidéo.
                    </video>
                </div>

                {/* Stills */}
                {data.stills?.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {data.stills.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`Still ${i + 1}`}
                                className="w-full aspect-video object-cover rounded-lg"
                            />
                        ))}
                    </div>
                )}

                {/* Synopsis */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h3 className="text-red-500 font-bold uppercase text-sm tracking-wider">Synopsis</h3>
                    <p className="text-gray-300 leading-relaxed">{data.english_synopsis}</p>
                    {data.original_synopsis !== data.english_synopsis && (
                        <p className="text-gray-400 leading-relaxed text-sm">{data.original_synopsis}</p>
                    )}
                </div>

                {/* Processus & Outils */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-xl p-6 space-y-2">
                        <h3 className="text-red-500 font-bold uppercase text-sm tracking-wider">Processus créatif</h3>
                        <p className="text-gray-300 leading-relaxed text-sm">{data.creative_process}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 space-y-2">
                        <h3 className="text-red-500 font-bold uppercase text-sm tracking-wider">Outils IA</h3>
                        <p className="text-gray-300 leading-relaxed text-sm">{data.ai_tools}</p>
                    </div>
                </div>

                {/* Réalisateur */}
                {director && (
                    <div className="bg-gray-800 rounded-xl p-6 space-y-2">
                        <h3 className="text-red-500 font-bold uppercase text-sm tracking-wider">Réalisateur</h3>
                        <p className="text-white font-semibold">
                            {director.gender} {director.firstname} {director.lastname}
                        </p>
                        {director.job && <p className="text-gray-400 text-sm">{director.job}</p>}
                        {director.country && <p className="text-gray-400 text-sm">{director.city}{director.city && director.country ? ', ' : ''}{director.country}</p>}
                    </div>
                )}

                {/* Collaborateurs */}
                {data.collaborators?.length > 0 && (
                    <div className="bg-gray-800 rounded-xl p-6 space-y-3">
                        <h3 className="text-red-500 font-bold uppercase text-sm tracking-wider">Équipe</h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {data.collaborators.map((c, i) => (
                                <div key={i} className="text-sm">
                                    <span className="text-white font-medium">{c.firstname} {c.lastname}</span>
                                    {c.contribution && <span className="text-gray-400"> — {c.contribution}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Soumis le */}
                <p className="text-gray-600 text-xs text-right">
                    Soumis le {new Date(data.submitted_at).toLocaleDateString('fr-FR')}
                </p>

            </div>

            {isJury && <JuryMoviePanel movie={data} />}
        </div>
    );
}

export default MoviePage;
