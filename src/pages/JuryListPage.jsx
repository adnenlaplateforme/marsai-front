import { useEffect, useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import TopPage from '../components/base/TopPage';
import TitlePage from '../components/base/TitlePage';

function JuryListPage() {
  const [juries, setJuries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJuries = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_SERVER_ADDRESS + '/juries');
        if (res.ok) {
          const data = await res.json();
          setJuries(data);
        } else {
          setError('Impossible de charger le jury.');
        }
      } catch (e) {
        setError('Erreur de connexion au serveur.');
      } finally {
        setLoading(false);
      }
    };
    fetchJuries();
  }, []);

  return (
    <div>
      <TopPage>
        <TitlePage hasUnderline>Le Jury</TitlePage>
      </TopPage>

      <section className="section">
        <div className="max-w-5xl mx-auto px-4">
          {loading && (
            <div className="flex flex-col items-center gap-8 text-neutral-300 py-20">
              <AiOutlineLoading3Quarters className="animate-spin size-16" />
            </div>
          )}

          {error && (
            <p className="text-center text-red-400 py-10">{error}</p>
          )}

          {!loading && !error && juries.length === 0 && (
            <p className="text-center text-neutral-400 py-10">
              Le jury sera annoncé prochainement.
            </p>
          )}

          {!loading && !error && juries.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 py-10">
              {juries.map(jury => (
                <div
                  key={jury.id}
                  className="flex flex-col items-center gap-3 bg-secondary rounded-2xl p-5"
                >
                  <div className="flex items-center justify-center uppercase text-3xl font-bold bg-primary size-20 rounded-full text-white">
                    {jury.firstname?.charAt(0)}
                    {jury.lastname?.charAt(0)}
                  </div>
                  <div className="text-center text-white font-semibold uppercase">
                    {jury.firstname} {jury.lastname}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default JuryListPage;
