let stock = JSON.parse(localStorage.getItem('stock')) || [];
let commandes = JSON.parse(localStorage.getItem('commandes')) || [];
let panier = [];
let nomClientActuel = '';

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFormProduit();
    initFormCommande();
    initModal();
    afficherStock();
    afficherCommandes();
    updateProduitSelect();
    
    document.getElementById('search-stock').addEventListener('input', filtrerStock);
    document.getElementById('search-commandes').addEventListener('input', filtrerCommandes);
    document.getElementById('btn-valider-commande').addEventListener('click', validerCommande);
});

function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(this.dataset.section).classList.add('active');
        });
    });
}

function initFormProduit() {
    document.getElementById('form-produit').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nom = document.getElementById('nom-produit').value.trim();
        const prix = parseFloat(document.getElementById('prix-produit').value);
        const quantite = parseInt(document.getElementById('quantite-produit').value);
        
        if (nom && prix > 0 && quantite >= 0) {
            const produit = {
                id: Date.now(),
                nom: nom,
                prix: prix,
                quantite: quantite
            };
            
            stock.push(produit);
            sauvegarderStock();
            afficherStock();
            updateProduitSelect();
            this.reset();
        }
    });
}

function initFormCommande() {
    document.getElementById('form-commande').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nomClient = document.getElementById('nom-client').value.trim();
        const produitId = parseInt(document.getElementById('produit-select').value);
        const quantite = parseInt(document.getElementById('quantite-commande').value);
        
        if (!nomClient) {
            alert('Veuillez entrer le nom du client');
            return;
        }
        
        nomClientActuel = nomClient;
        
        const produit = stock.find(p => p.id === produitId);
        
        if (!produit) {
            alert('Produit non trouvé');
            return;
        }
        
        if (quantite > produit.quantite) {
            alert(`Stock insuffisant. Disponible: ${produit.quantite}`);
            return;
        }
        
        const itemPanier = panier.find(item => item.produitId === produitId);
        
        if (itemPanier) {
            if (itemPanier.quantite + quantite > produit.quantite) {
                alert(`Stock insuffisant. Disponible: ${produit.quantite}`);
                return;
            }
            itemPanier.quantite += quantite;
        } else {
            panier.push({
                produitId: produitId,
                nom: produit.nom,
                prix: produit.prix,
                quantite: quantite
            });
        }
        
        afficherPanier();
        document.getElementById('quantite-commande').value = '';
    });
}

function initModal() {
    const modal = document.getElementById('modal-recu');
    const span = document.getElementsByClassName('close')[0];
    
    span.onclick = function() {
        modal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
    
    document.getElementById('btn-imprimer').addEventListener('click', function() {
        window.print();
    });
}

function afficherStock() {
    const tbody = document.getElementById('tbody-stock');
    tbody.innerHTML = '';
    
    stock.forEach(produit => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produit.nom}</td>
            <td>${produit.prix.toFixed(0)} FCFA</td>
            <td>${produit.quantite}</td>
            <td>
                <button class="btn-action btn-modifier" onclick="modifierProduit(${produit.id})">Modifier</button>
                <button class="btn-action btn-supprimer" onclick="supprimerProduit(${produit.id})">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrerStock() {
    const recherche = document.getElementById('search-stock').value.toLowerCase();
    const lignes = document.querySelectorAll('#tbody-stock tr');
    
    lignes.forEach(ligne => {
        const texte = ligne.textContent.toLowerCase();
        ligne.style.display = texte.includes(recherche) ? '' : 'none';
    });
}

function modifierProduit(id) {
    const produit = stock.find(p => p.id === id);
    if (!produit) return;
    
    const nouveauNom = prompt('Nouveau nom:', produit.nom);
    const nouveauPrix = prompt('Nouveau prix (FCFA):', produit.prix);
    const nouvelleQuantite = prompt('Nouvelle quantité:', produit.quantite);
    
    if (nouveauNom !== null && nouveauPrix !== null && nouvelleQuantite !== null) {
        produit.nom = nouveauNom.trim();
        produit.prix = parseFloat(nouveauPrix);
        produit.quantite = parseInt(nouvelleQuantite);
        
        sauvegarderStock();
        afficherStock();
        updateProduitSelect();
    }
}

function supprimerProduit(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
        stock = stock.filter(p => p.id !== id);
        sauvegarderStock();
        afficherStock();
        updateProduitSelect();
    }
}

function updateProduitSelect() {
    const select = document.getElementById('produit-select');
    select.innerHTML = '<option value="">Sélectionner un produit</option>';
    
    stock.forEach(produit => {
        const option = document.createElement('option');
        option.value = produit.id;
        option.textContent = `${produit.nom} - ${produit.prix.toFixed(0)} FCFA (Stock: ${produit.quantite})`;
        select.appendChild(option);
    });
}

function afficherPanier() {
    const tbody = document.getElementById('tbody-panier');
    tbody.innerHTML = '';
    
    let total = 0;
    
    panier.forEach((item, index) => {
        const sousTotal = item.prix * item.quantite;
        total += sousTotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nom}</td>
            <td>${item.prix.toFixed(0)} FCFA</td>
            <td>${item.quantite}</td>
            <td>${sousTotal.toFixed(0)} FCFA</td>
            <td>
                <button class="btn-action btn-supprimer" onclick="retirerDuPanier(${index})">Retirer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('total-panier').textContent = `${total.toFixed(0)} FCFA`;
}

function retirerDuPanier(index) {
    panier.splice(index, 1);
    afficherPanier();
}

function validerCommande() {
    if (panier.length === 0) {
        alert('Le panier est vide');
        return;
    }
    
    if (!nomClientActuel) {
        alert('Veuillez entrer le nom du client');
        return;
    }
    
    panier.forEach(item => {
        const produit = stock.find(p => p.id === item.produitId);
        if (produit) {
            produit.quantite -= item.quantite;
        }
    });
    
    const commande = {
        id: Date.now(),
        numeroCommande: 'CMD-' + Date.now(),
        client: nomClientActuel,
        date: new Date().toLocaleString('fr-FR'),
        items: [...panier],
        total: panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0)
    };
    
    commandes.push(commande);
    sauvegarderCommandes();
    sauvegarderStock();
    afficherCommandes();
    afficherStock();
    updateProduitSelect();
    
    afficherRecu(commande);
    
    panier = [];
    nomClientActuel = '';
    document.getElementById('form-commande').reset();
    afficherPanier();
}

function afficherCommandes() {
    const tbody = document.getElementById('tbody-commandes');
    tbody.innerHTML = '';
    
    commandes.slice().reverse().forEach(commande => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${commande.numeroCommande}</td>
            <td>${commande.client}</td>
            <td>${commande.date}</td>
            <td>${commande.total.toFixed(0)} FCFA</td>
            <td>
                <button class="btn-action btn-recu" onclick="afficherRecu(${commande.id})">Reçu</button>
                <button class="btn-action btn-supprimer" onclick="supprimerCommande(${commande.id})">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrerCommandes() {
    const recherche = document.getElementById('search-commandes').value.toLowerCase();
    const lignes = document.querySelectorAll('#tbody-commandes tr');
    
    lignes.forEach(ligne => {
        const texte = ligne.textContent.toLowerCase();
        ligne.style.display = texte.includes(recherche) ? '' : 'none';
    });
}

function supprimerCommande(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande?')) {
        commandes = commandes.filter(c => c.id !== id);
        sauvegarderCommandes();
        afficherCommandes();
    }
}

function afficherRecu(commandeOuId) {
    let commande;
    
    if (typeof commandeOuId === 'object') {
        commande = commandeOuId;
    } else {
        commande = commandes.find(c => c.id === commandeOuId);
    }
    
    if (!commande) return;
    
    let itemsHTML = '';
    commande.items.forEach(item => {
        const sousTotal = item.prix * item.quantite;
        itemsHTML += `
            <tr>
                <td>${item.nom}</td>
                <td>${item.prix.toFixed(0)} FCFA</td>
                <td>${item.quantite}</td>
                <td>${sousTotal.toFixed(0)} FCFA</td>
            </tr>
        `;
    });
    
    const recuHTML = `
        <div class="recu-header">
            <h2>REÇU DE VENTE</h2>
            <p>Ma Boutique</p>
        </div>
        
        <div class="recu-info">
            <p><strong>N° Commande:</strong> ${commande.numeroCommande}</p>
            <p><strong>Client:</strong> ${commande.client}</p>
            <p><strong>Date:</strong> ${commande.date}</p>
        </div>
        
        <table class="recu-table">
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
                    <th>Sous-total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>
        
        <div class="recu-total">
            TOTAL: ${commande.total.toFixed(0)} FCFA
        </div>
        
        <div class="recu-footer">
            <p>Merci pour votre achat!</p>
            <p>À bientôt</p>
        </div>
    `;
    
    document.getElementById('recu-content').innerHTML = recuHTML;
    document.getElementById('modal-recu').style.display = 'block';
}

function sauvegarderStock() {
    localStorage.setItem('stock', JSON.stringify(stock));
}

function sauvegarderCommandes() {
    localStorage.setItem('commandes', JSON.stringify(commandes));
}
