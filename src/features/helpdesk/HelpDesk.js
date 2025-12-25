import React, { useState } from 'react';
import { 
  MdSearch, MdExpandMore, MdExpandLess, MdEmail, MdPhone,
  MdChevronRight
} from 'react-icons/md';
import './helpdesk-sidebar.css';

const HelpDesk = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [expandedFaqs, setExpandedFaqs] = useState([]);
  const [showAll, setShowAll] = useState(false);
  
  // Topics for sidebar
  const topics = [
    { id: 'all', name: 'Tous les sujets', count: 23 },
    { id: 'reservations', name: 'Réservations', count: 6 },
    { id: 'rooms', name: 'Chambres', count: 4 },
    { id: 'payments', name: 'Paiements', count: 3 },
    { id: 'guests', name: 'Clients', count: 2 },
    { id: 'taxes', name: 'Taxes', count: 2 },
    { id: 'reports', name: 'Rapports', count: 6 }
  ];
  
  // FAQs
  const faqs = [
    // RÉSERVATIONS
    {
      id: 1,
      category: 'reservations',
      question: 'Comment créer une nouvelle réservation ?',
      answer: 'Allez dans Réservations → Cliquez sur "+ Nouvelle Réservation" → Sélectionnez le type de chambre → Choisissez les dates d\'arrivée et de départ → Remplissez les informations du client (nom, email, téléphone) → Vérifiez le prix total → Cliquez sur "Créer la réservation".',
      popular: true
    },
    {
      id: 2,
      category: 'reservations',
      question: 'Comment fonctionne la disponibilité des chambres ?',
      answer: 'Le système gère la disponibilité automatiquement. Lorsqu\'un client réserve (en ligne ou via l\'admin), la disponibilité diminue immédiatement pour ce type de chambre, même si aucune chambre spécifique n\'est encore attribuée. Cela empêche les surréservations. Vous attribuerez une chambre physique spécifique plus tard. Si un client ne se présente pas (No-Show), le système annule automatiquement la réservation après 24h et libère la disponibilité.',
      popular: true
    },
    {
      id: 3,
      category: 'reservations',
      question: 'Comment modifier une réservation existante ?',
      answer: 'Allez dans Réservations → Trouvez la réservation dans la liste → Cliquez sur les trois points (⋮) → Sélectionnez "Modifier" → Mettez à jour les dates, le type de chambre ou les informations client → Enregistrez. Note: Le prix sera recalculé automatiquement si vous changez les dates ou le type de chambre.',
      popular: false
    },
    {
      id: 4,
      category: 'reservations',
      question: 'Comment annuler une réservation ?',
      answer: 'Allez dans Réservations → Trouvez la réservation → Cliquez sur (⋮) → Sélectionnez "Modifier" → Changez le statut en "Annulé" → Enregistrez. La chambre sera automatiquement libérée et redeviendra disponible pour d\'autres réservations.',
      popular: false
    },
    {
      id: 5,
      category: 'reservations',
      question: 'Que signifient les différents statuts de réservation ?',
      answer: 'CONFIRMÉ: Réservation active en attente d\'arrivée. CHECKED_IN: Client actuellement à l\'hôtel. CHECKED_OUT: Séjour terminé, client parti. ANNULÉ: Réservation annulée. NO_SHOW: Client ne s\'est pas présenté (annulation automatique après 24h).',
      popular: true
    },
    {
      id: 6,
      category: 'reservations',
      question: 'Comment attribuer une chambre spécifique à une réservation ?',
      answer: 'Allez dans Réservations → Trouvez la réservation → Cliquez sur "Modifier" → Dans le champ "Chambre Assignée", sélectionnez une chambre disponible du type réservé → Enregistrez. Vous pouvez faire cela à tout moment avant ou pendant le check-in.',
      popular: false
    },
    
    // CHAMBRES
    {
      id: 7,
      category: 'rooms',
      question: 'Comment ajouter une nouvelle chambre ?',
      answer: 'Allez dans Chambres → Cliquez sur "+ Nouvelle Chambre" → Entrez le numéro de chambre → Sélectionnez le type de chambre (Standard, Deluxe, Suite) → Choisissez l\'étage → Définissez le statut initial (généralement "Disponible") → Enregistrez.',
      popular: true
    },
    {
      id: 8,
      category: 'rooms',
      question: 'Comment changer le statut d\'une chambre ?',
      answer: 'Allez dans Chambres → Trouvez la chambre → Cliquez sur le menu (⋮) → Sélectionnez "Modifier" → Changez le statut (Disponible, Occupée, Nettoyage, Maintenance, Hors Service) → Enregistrez. Le statut "Occupée" est généralement défini automatiquement lors du check-in.',
      popular: true
    },
    {
      id: 9,
      category: 'rooms',
      question: 'Comment gérer les types de chambres et leurs prix ?',
      answer: 'Allez dans Paramètres → Types de Chambres → Vous pouvez ajouter/modifier les types (Standard, Deluxe, Suite, etc.) → Définissez le prix par nuit, la capacité, les équipements → Ajoutez des photos et descriptions → Enregistrez. Ces informations apparaîtront sur le site public de réservation.',
      popular: false
    },
    {
      id: 10,
      category: 'rooms',
      question: 'Que faire si une chambre nécessite une maintenance ?',
      answer: 'Changez le statut de la chambre en "Maintenance" ou "Hors Service". Cela empêchera le système de l\'attribuer à de nouvelles réservations. Une fois les réparations terminées, remettez le statut sur "Disponible".',
      popular: false
    },
    
    // PAIEMENTS
    {
      id: 11,
      category: 'payments',
      question: 'Comment enregistrer un paiement ?',
      answer: 'Allez dans Réservations → Cliquez sur la réservation → Dans la section "Paiements", cliquez sur "Ajouter un paiement" → Entrez le montant → Sélectionnez la méthode (Espèces, Carte bancaire, Virement, Mobile Money) → Ajoutez une note si nécessaire → Enregistrez. Le solde restant sera mis à jour automatiquement.',
      popular: true
    },
    {
      id: 12,
      category: 'payments',
      question: 'Comment émettre un remboursement ?',
      answer: 'Allez dans la réservation → Section "Paiements" → Trouvez le paiement à rembourser → Cliquez sur "Rembourser" → Entrez le montant du remboursement → Confirmez. Le remboursement sera enregistré dans l\'historique des transactions.',
      popular: false
    },
    {
      id: 13,
      category: 'payments',
      question: 'Quelles méthodes de paiement sont acceptées ?',
      answer: 'Le système supporte: Espèces (CASH), Carte bancaire (CARD), Virement bancaire (BANK_TRANSFER), et Mobile Money (MOBILE_MONEY). Vous pouvez sélectionner la méthode appropriée lors de l\'enregistrement de chaque paiement.',
      popular: false
    },
    
    // CLIENTS
    {
      id: 14,
      category: 'guests',
      question: 'Comment ajouter un nouveau client ?',
      answer: 'Les clients sont généralement créés automatiquement lors de la création d\'une réservation. Vous pouvez aussi aller dans Clients → "+ Nouveau Client" → Remplissez nom, prénom, email, téléphone, nationalité → Enregistrez. Le client sera disponible pour les futures réservations.',
      popular: true
    },
    {
      id: 15,
      category: 'guests',
      question: 'Comment voir l\'historique des séjours d\'un client ?',
      answer: 'Allez dans Clients → Trouvez le client dans la liste → Cliquez sur son nom → Vous verrez toutes ses réservations passées et futures, avec les dates, montants payés, et statuts.',
      popular: false
    },
    
    // TAXES
    {
      id: 16,
      category: 'taxes',
      question: 'Comment activer et configurer les taxes ?',
      answer: 'Allez dans Paramètres → Onglet "Taxes" → Activez le système de taxes → Ajoutez les taxes applicables (TVA, Taxe de séjour, etc.) avec leurs taux → Enregistrez. Les taxes seront automatiquement calculées et ajoutées aux nouvelles réservations. Important: Les taxes ne s\'appliquent PAS rétroactivement aux anciennes réservations.',
      popular: true
    },
    {
      id: 17,
      category: 'taxes',
      question: 'Pourquoi certaines réservations n\'ont pas de taxes ?',
      answer: 'Les taxes ne s\'appliquent qu\'aux nouvelles réservations créées APRÈS l\'activation du système de taxes. Les réservations passées (CHECKED_OUT, CANCELLED) conservent leur prix original sans taxes pour respecter l\'accord initial avec le client.',
      popular: false
    },
    
    // RAPPORTS
    {
      id: 18,
      category: 'reports',
      question: 'Comment générer des rapports ?',
      answer: 'Allez dans Rapports → Sélectionnez le type de rapport (Revenus, Occupancy, Réservations, etc.) → Choisissez la période (aujourd\'hui, cette semaine, ce mois, personnalisée) → Cliquez sur "Générer" → Le rapport s\'affichera avec des graphiques et tableaux. Vous pouvez l\'exporter en PDF ou Excel.',
      popular: true
    },
    {
      id: 19,
      category: 'reports',
      question: 'Quels types de rapports sont disponibles ?',
      answer: 'Le système offre plusieurs types de rapports : 1) Rapport de Revenus - Analyse des revenus par période, type de chambre, et méthode de paiement. 2) Rapport d\'Occupation - Taux d\'occupation quotidien, hebdomadaire et mensuel. 3) Rapport de Réservations - Statistiques sur les réservations (confirmées, annulées, no-shows). 4) Rapport de Paiements - Détails des transactions et méthodes de paiement. 5) Rapport de Performance - Vue d\'ensemble des KPIs de l\'hôtel.',
      popular: true
    },
    {
      id: 20,
      category: 'reports',
      question: 'Comment interpréter le taux d\'occupation ?',
      answer: 'Le taux d\'occupation indique le pourcentage de chambres occupées sur une période donnée. Formule: (Nombre de chambres occupées ÷ Nombre total de chambres) × 100. Par exemple, si vous avez 20 chambres et 15 sont occupées, le taux est de 75%. Un taux élevé (>80%) indique une bonne performance. Le rapport montre aussi l\'évolution dans le temps avec des graphiques.',
      popular: true
    },
    {
      id: 21,
      category: 'reports',
      question: 'Comment analyser les revenus par type de chambre ?',
      answer: 'Dans le rapport de Revenus, vous verrez une répartition par type de chambre (Standard, Deluxe, Suite). Cela vous permet d\'identifier quels types génèrent le plus de revenus. Utilisez ces données pour ajuster vos prix, promotions, ou allocation de chambres. Le rapport inclut aussi le RevPAR (Revenue Per Available Room) pour chaque type.',
      popular: false
    },
    {
      id: 22,
      category: 'reports',
      question: 'Que signifie le RevPAR et comment l\'utiliser ?',
      answer: 'RevPAR (Revenue Per Available Room) = Revenus totaux ÷ Nombre de chambres disponibles. C\'est un indicateur clé de performance qui combine le taux d\'occupation et le prix moyen. Un RevPAR élevé indique que vous maximisez vos revenus. Comparez votre RevPAR d\'un mois à l\'autre pour suivre les tendances et identifier les périodes creuses.',
      popular: false
    },
    {
      id: 23,
      category: 'reports',
      question: 'Comment exporter et partager les rapports ?',
      answer: 'Après avoir généré un rapport, cliquez sur le bouton "Exporter" en haut à droite. Choisissez le format : PDF (idéal pour impression et présentation) ou Excel (pour analyse approfondie). Le fichier sera téléchargé automatiquement. Vous pouvez ensuite le partager par email ou l\'imprimer pour vos réunions de gestion.',
      popular: false
    }
  ];
  
  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesTopic = selectedTopic === 'all' || faq.category === selectedTopic;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });
  
  // Get popular FAQs
  const popularFaqs = filteredFaqs.filter(faq => faq.popular);
  const displayFaqs = showAll ? filteredFaqs : popularFaqs;
  
  // Toggle FAQ
  const toggleFaq = (id) => {
    setExpandedFaqs(prev => 
      prev.includes(id) ? prev.filter(faqId => faqId !== id) : [...prev, id]
    );
  };

  return (
    <div className="helpdesk-sidebar-container">
      {/* Sidebar */}
      <div className="helpdesk-sidebar">
        {/* Topics Section */}
        <div className="sidebar-section">
          <h3 className="sidebar-title">Sujets</h3>
          <ul className="topics-list">
            {topics.map(topic => (
              <li 
                key={topic.id}
                className={`topic-item ${selectedTopic === topic.id ? 'active' : ''}`}
                onClick={() => setSelectedTopic(topic.id)}
              >
                <span className="topic-name">{topic.name}</span>
                <span className="topic-count">{topic.count}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Contact Section */}
        <div className="sidebar-section contact-section">
          <h3 className="sidebar-title">Contact</h3>
          <div className="contact-item">
            <MdEmail className="contact-icon" />
            <div className="contact-info">
              <span className="contact-label">Email</span>
              <span className="contact-value">leprocess@intnet.td</span>
            </div>
          </div>
          <div className="contact-item">
            <MdPhone className="contact-icon" />
            <div className="contact-info">
              <span className="contact-label">Téléphone</span>
              <span className="contact-value">+235 68 88 93 33</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="helpdesk-main">
        {/* Header */}
        <div className="main-header">
          <h1>Centre d'Aide</h1>
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <MdSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher de l'aide..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Articles Section */}
        <div className="articles-section">
          <h2 className="section-title">
            {showAll ? 'Tous les Articles' : 'Articles Populaires'}
          </h2>
          
          {displayFaqs.length > 0 ? (
            <div className="articles-list">
              {displayFaqs.map(faq => (
                <div key={faq.id} className="article-item">
                  <div 
                    className="article-header"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <div className="article-title-wrapper">
                      <MdChevronRight 
                        className={`article-icon ${expandedFaqs.includes(faq.id) ? 'expanded' : ''}`}
                      />
                      <h3 className="article-title">{faq.question}</h3>
                    </div>
                    <div className="article-toggle">
                      {expandedFaqs.includes(faq.id) ? 
                        <MdExpandLess /> : <MdExpandMore />
                      }
                    </div>
                  </div>
                  {expandedFaqs.includes(faq.id) && (
                    <div className="article-content">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>Aucun article trouvé</p>
            </div>
          )}
          
          {/* Show More/Less Button */}
          {!searchQuery && filteredFaqs.length > popularFaqs.length && (
            <button 
              className="show-more-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Voir Moins' : 'Voir Plus'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpDesk;
