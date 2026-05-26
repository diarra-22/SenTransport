import { useState, useEffect } from 'react';
import './App.css';
import Header from './Header';
import Recherche from './Recherche';
import LigneBus from './LigneBus';
import DetailLigne from './DetailLigne';
import Footer from './Footer';
import Carte from './Carte';
import Meteo from './Meteo';
import SignalerIncident from './SignalerIncident';

function App() {
  const [recherche, setRecherche] = useState("");
  const [ligneSelectionnee, setLigneSelectionnee] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [nbRecherches, setNbRecherches] = useState(0);

  const chargerDonnees = () => {
    setChargement(true);
    setErreur(null);

    fetch("http://localhost:5000/lignes")
      .then(response => {
        if (!response.ok) {
          throw new Error("Erreur serveur : " + response.status);
        }
        return response.json();
      })
      .then(data => {
        setLignes(data);
        setChargement(false);
      })
      .catch(error => {
        setErreur(error.message);
        setChargement(false);
      });
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  if (chargement) {
    return (
      <div className="App">
        <Header />
        <main className="contenu">
          <p className="message-chargement">Chargement des lignes...</p>
        </main>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="App">
        <Header />
        <main className="contenu">
          <div className="message-erreur">
            <p>Impossible de charger les lignes.</p>
            <p className="erreur-detail">{erreur}</p>
            <p>Vérifiez que le serveur Flask est lancé (python api/app.py).</p>
            <button onClick={chargerDonnees} className="btn-recharger-erreur" style={{ marginTop: '15px', padding: '8px 16px', cursor: 'pointer' }}>
              🔄 Réessayer
            </button>
          </div>
        </main>
      </div>
    );
  }

  const lignesFiltrees = lignes.filter(l =>
    l.depart.toLowerCase().includes(recherche.toLowerCase()) ||
    l.arrivee.toLowerCase().includes(recherche.toLowerCase()) ||
    l.numero.includes(recherche)
  );

  function handleClickLigne(ligne) {
    if (ligneSelectionnee && ligneSelectionnee.id === ligne.id) {
      setLigneSelectionnee(null);
    } else {
      fetch(`http://localhost:5000/lignes/${ligne.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Impossible de charger les détails (Statut : " + response.status + ")");
          }
          return response.json();
        })
        .then(data => {
          setLigneSelectionnee(data);
        })
        .catch(error => {
          alert(error.message);
        });
    }
  }

  return (
    <div className="App">
      <Header />
      <main className="contenu">
        <Meteo />
        <Recherche
          valeur={recherche}
          onChange={(valeur) => {
            setRecherche(valeur);
            setNbRecherches(nbRecherches + 1);
          }}
        />
        <div style={{ textAlign: 'center', margin: '15px 0' }}>
          <button onClick={chargerDonnees} className="btn-recharger" style={{ padding: '10px 20px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: '#f8f9fa' }}>
            🔄 Recharger les lignes
          </button>
        </div>
        <p className="resultat-recherche">
          {lignesFiltrees.length === 0 && (
            <span className="aucun-resultat">Aucune ligne trouvée <br/></span>
          )}
          {lignesFiltrees.length} ligne{lignesFiltrees.length > 1 ? 's' : ''} trouvée{lignesFiltrees.length > 1 ? 's' : ''}
        </p>
        {lignesFiltrees.map(ligne => (
          <LigneBus
            key={ligne.id}
            numero={ligne.numero}
            depart={ligne.depart}
            arrivee={ligne.arrivee}
            arrets={ligne.arrets}
            estSelectionnee={ligneSelectionnee && ligneSelectionnee.id === ligne.id}
            onClick={() => handleClickLigne(ligne)}
          />
        ))}
        {ligneSelectionnee && <DetailLigne ligne={ligneSelectionnee} />}
        <Carte />
        <SignalerIncident />
      </main>
      <Footer />
    </div>
  );
}

export default App;