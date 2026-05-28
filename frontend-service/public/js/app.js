// Core Application State
let currentUser = null;
let currentToken = null;
let config = null;

// Connection caches for status checking
let myConnections = {
  receivedPending: [],
  sentPending: [],
  accepted: []
};
const connectionMap = new Map(); // maps otherUserId -> connectionStatus ('pending' or 'accepted')

// Run on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check session
  currentToken = localStorage.getItem('matrimony_token');
  const userJson = localStorage.getItem('matrimony_user');
  
  if (!currentToken || !userJson) {
    window.location.href = '/auth.html';
    return;
  }
  
  currentUser = JSON.parse(userJson);
  
  // Initialize config
  config = await getAppConfig();
  
  // Set up header info
  document.getElementById('header-user-name').textContent = currentUser.name;
  if (currentUser.photoUrl) {
    document.getElementById('header-user-avatar').src = currentUser.photoUrl;
  }
  
  document.getElementById('welcome-message').textContent = `Welcome back, ${currentUser.name}!`;

  // Initialize tabs & listeners
  initTabs();
  initForms();
  
  // Load initial dashboard recommendations
  await fetchUserConnections();
  await loadDashboard();
});

// Load all user connections to map them for buttons status
async function fetchUserConnections() {
  if (!currentUser || !config) return;
  
  try {
    const response = await fetch(`${config.connectionServiceUrl}/api/connections/user/${currentUser._id}`);
    if (!response.ok) throw new Error();
    
    myConnections = await response.json();
    
    // Clear and build the status map
    connectionMap.clear();
    
    myConnections.receivedPending.forEach(c => {
      connectionMap.set(c.user._id, { status: 'pending', type: 'received', connectionId: c.connectionId });
    });
    
    myConnections.sentPending.forEach(c => {
      connectionMap.set(c.user._id, { status: 'pending', type: 'sent', connectionId: c.connectionId });
    });
    
    myConnections.accepted.forEach(c => {
      connectionMap.set(c.user._id, { status: 'accepted', type: 'mutual', connectionId: c.connectionId });
    });

    // Update notification badges
    const pendingCount = myConnections.receivedPending.length;
    const badge = document.getElementById('header-pending-count');
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }

  } catch (error) {
    console.error('Error fetching connections:', error);
  }
}

// Navigation Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  const sections = document.querySelectorAll('.app-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      const targetSectionId = tab.getAttribute('data-target');
      
      // Update active tab button style
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active section visibility
      sections.forEach(s => s.classList.remove('active'));
      const activeSection = document.getElementById(targetSectionId);
      activeSection.classList.add('active');
      
      // Trigger tab-specific loads
      if (targetSectionId === 'dashboard-section') {
        await fetchUserConnections();
        await loadDashboard();
      } else if (targetSectionId === 'search-section') {
        await fetchUserConnections();
        // pre-populate target search gender (opposite of current user)
        const targetGender = currentUser.gender === 'Male' ? 'Female' : 'Male';
        document.getElementById('search-gender').value = targetGender;
        await loadSearchResults();
      } else if (targetSectionId === 'connections-section') {
        await fetchUserConnections();
        loadConnectionsViews();
      } else if (targetSectionId === 'profile-section') {
        populateProfileFields();
      }
    });
  });

  // Connections Sub-tabs (Interested, Sent, Mutual)
  const connTabs = document.querySelectorAll('.conn-tab-btn');
  const connPanes = document.querySelectorAll('.connections-pane');

  connTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      connTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetPaneId = tab.getAttribute('data-pane');
      connPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(targetPaneId).classList.add('active');
    });
  });

  // Sign out click handler
  document.getElementById('sign-out-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('matrimony_token');
    localStorage.removeItem('matrimony_user');
    showToast('Signed out successfully.', 'success');
    setTimeout(() => {
      window.location.href = '/auth.html';
    }, 800);
  });
}

// Form logic initialization
function initForms() {
  // Search Filters Submit
  document.getElementById('apply-filters-btn').addEventListener('click', async () => {
    await loadSearchResults();
  });

  // Profile Edit Submit
  document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('edit-name').value;
    const location = document.getElementById('edit-location').value;
    const religion = document.getElementById('edit-religion').value;
    const motherTongue = document.getElementById('edit-mothertongue').value;
    const profession = document.getElementById('edit-profession').value;
    const education = document.getElementById('edit-education').value;
    const height = document.getElementById('edit-height').value;
    const photoUrl = document.getElementById('edit-photo').value;
    const bio = document.getElementById('edit-bio').value;

    try {
      const response = await fetch(`${config.userServiceUrl}/api/users/profile/${currentUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, location, religion, motherTongue, profession, education, height, photoUrl, bio
        })
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || 'Failed to update profile.', 'error');
        return;
      }

      // Update local storage credentials
      currentUser = data.user;
      localStorage.setItem('matrimony_user', JSON.stringify(currentUser));
      
      // Update header details
      document.getElementById('header-user-name').textContent = currentUser.name;
      if (currentUser.photoUrl) {
        document.getElementById('header-user-avatar').src = currentUser.photoUrl;
        document.getElementById('profile-edit-img').src = currentUser.photoUrl;
      }
      
      showToast('Profile settings saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error saving profile changes.', 'error');
    }
  });
}

// Dashboard loader
async function loadDashboard() {
  const container = document.getElementById('recommendations-container');
  container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading matching recommendations...</p></div>`;

  try {
    const response = await fetch(`${config.matchServiceUrl}/api/matches/recommendations/${currentUser._id}`);
    if (!response.ok) throw new Error();
    const recommendations = await response.json();

    if (recommendations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-heart-crack"></i>
          <p>No new recommendations found at the moment. Try updating your profile details.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    recommendations.forEach(profile => {
      container.appendChild(createProfileCard(profile));
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Could not connect to Match Service. Make sure it is running.</p>
      </div>
    `;
  }
}

// Search Results Loader
async function loadSearchResults() {
  const container = document.getElementById('search-results-container');
  container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Searching profiles...</p></div>`;

  const gender = document.getElementById('search-gender').value;
  const ageMin = document.getElementById('search-age-min').value;
  const ageMax = document.getElementById('search-age-max').value;
  const religion = document.getElementById('search-religion').value;
  const location = document.getElementById('search-location').value;
  const profession = document.getElementById('search-profession').value;

  try {
    let queryParams = `gender=${gender}&ageMin=${ageMin}&ageMax=${ageMax}&currentUserId=${currentUser._id}`;
    if (religion && religion !== 'All') queryParams += `&religion=${religion}`;
    if (location) queryParams += `&location=${encodeURIComponent(location)}`;
    if (profession) queryParams += `&profession=${encodeURIComponent(profession)}`;

    const response = await fetch(`${config.matchServiceUrl}/api/matches/search?${queryParams}`);
    if (!response.ok) throw new Error();
    const results = await response.json();

    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-face-frown"></i>
          <p>No profiles match your specific filters. Try expanding your search criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    results.forEach(profile => {
      container.appendChild(createProfileCard(profile));
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Could not connect to Match Service. Make sure it is running.</p>
      </div>
    `;
  }
}

// Helper to create a single profile card element
function createProfileCard(profile) {
  const card = document.createElement('div');
  card.className = 'profile-card';

  // Determine button state based on connectionMap
  const connState = connectionMap.get(profile._id);
  let actionBtnHtml = '';

  if (connState) {
    if (connState.status === 'pending') {
      if (connState.type === 'received') {
        actionBtnHtml = `
          <button class="btn btn-secondary accept-conn-btn" data-conn-id="${connState.connectionId}">
            <i class="fa-solid fa-check"></i> Accept Interest
          </button>
        `;
      } else {
        actionBtnHtml = `
          <button class="btn btn-secondary" style="opacity: 0.7; cursor: not-allowed;" disabled>
            <i class="fa-solid fa-hourglass-start"></i> Pending Approval
          </button>
        `;
      }
    } else if (connState.status === 'accepted') {
      actionBtnHtml = `
        <button class="btn btn-accent" style="cursor: default;" disabled>
          <i class="fa-solid fa-check-double"></i> Connected Match
        </button>
      `;
    }
  } else {
    actionBtnHtml = `
      <button class="btn btn-primary connect-profile-btn" data-receiver-id="${profile._id}">
        <i class="fa-solid fa-heart"></i> Express Interest
      </button>
    `;
  }

  // Calculate matching details
  card.innerHTML = `
    <div class="profile-card-image-wrap">
      <img src="${profile.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=350&h=350&fit=crop'}" class="profile-card-img" alt="${profile.name}">
      <span class="profile-card-badge">${profile.religion}</span>
    </div>
    <div class="profile-card-details">
      <div>
        <div class="profile-name-age">
          <h4>${profile.name}</h4>
          <span class="age">${profile.age} yrs</span>
        </div>
        <div class="profile-meta-info">
          <span><i class="fa-solid fa-briefcase"></i> ${profile.profession}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${profile.location}</span>
          <span><i class="fa-solid fa-comments"></i> ${profile.motherTongue}</span>
          <span><i class="fa-solid fa-arrows-up-down"></i> ${profile.height || "5'5\""}</span>
          <span><i class="fa-solid fa-graduation-cap"></i> ${profile.education || 'Graduate'}</span>
        </div>
        <p class="profile-bio">${profile.bio || 'Looking for an understanding life partner.'}</p>
      </div>
      <div class="profile-card-actions">
        ${actionBtnHtml}
      </div>
    </div>
  `;

  // Attach button events
  const connectBtn = card.querySelector('.connect-profile-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', async (e) => {
      const receiverId = connectBtn.getAttribute('data-receiver-id');
      await sendConnectionRequest(receiverId, connectBtn);
    });
  }

  const acceptBtn = card.querySelector('.accept-conn-btn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', async (e) => {
      const connId = acceptBtn.getAttribute('data-conn-id');
      await respondToRequest(connId, 'accepted');
    });
  }

  return card;
}

// Express Interest (Like / Send Request)
async function sendConnectionRequest(receiverId, buttonElement) {
  if (!currentUser || !config) return;
  
  buttonElement.disabled = true;
  buttonElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

  try {
    const response = await fetch(`${config.connectionServiceUrl}/api/connections/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUser._id,
        receiverId
      })
    });

    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || 'Could not send request', 'error');
      buttonElement.disabled = false;
      buttonElement.innerHTML = `<i class="fa-solid fa-heart"></i> Express Interest`;
      return;
    }

    showToast('Interest expressed! Waiting for response.', 'success');
    
    // Refresh connections cache and redraw current views
    await fetchUserConnections();
    
    // Refresh card state dynamically
    const parentCard = buttonElement.closest('.profile-card');
    const actionsContainer = parentCard.querySelector('.profile-card-actions');
    actionsContainer.innerHTML = `
      <button class="btn btn-secondary" style="opacity: 0.7; cursor: not-allowed;" disabled>
        <i class="fa-solid fa-hourglass-start"></i> Pending Approval
      </button>
    `;

  } catch (error) {
    console.error(error);
    showToast('Failed to send connection request.', 'error');
    buttonElement.disabled = false;
    buttonElement.innerHTML = `<i class="fa-solid fa-heart"></i> Express Interest`;
  }
}

// Load connection tab sub-panes
function loadConnectionsViews() {
  const receivedContainer = document.getElementById('received-connections-container');
  const sentContainer = document.getElementById('sent-connections-container');
  const acceptedContainer = document.getElementById('accepted-connections-container');

  // Update counts
  document.getElementById('received-count').textContent = myConnections.receivedPending.length;
  document.getElementById('sent-count').textContent = myConnections.sentPending.length;
  document.getElementById('accepted-count').textContent = myConnections.accepted.length;

  // 1. Render Received pending
  if (myConnections.receivedPending.length === 0) {
    receivedContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-heart-circle-exclamation"></i>
        <p>No pending partner interests received yet.</p>
      </div>
    `;
  } else {
    receivedContainer.innerHTML = '';
    myConnections.receivedPending.forEach(c => {
      receivedContainer.appendChild(createConnectionCard(c, 'received'));
    });
  }

  // 2. Render Sent pending
  if (myConnections.sentPending.length === 0) {
    sentContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-paper-plane"></i>
        <p>You haven't sent any connection requests yet.</p>
      </div>
    `;
  } else {
    sentContainer.innerHTML = '';
    myConnections.sentPending.forEach(c => {
      sentContainer.appendChild(createConnectionCard(c, 'sent'));
    });
  }

  // 3. Render Accepted
  if (myConnections.accepted.length === 0) {
    acceptedContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-comments"></i>
        <p>Your accepted matches will appear here. Start expressing interests!</p>
      </div>
    `;
  } else {
    acceptedContainer.innerHTML = '';
    myConnections.accepted.forEach(c => {
      acceptedContainer.appendChild(createConnectionCard(c, 'accepted'));
    });
  }
}

// Create connection list card elements
function createConnectionCard(conn, type) {
  const div = document.createElement('div');
  div.className = 'conn-card';
  
  const user = conn.user;
  const timeStr = new Date(conn.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  
  let actionHtml = '';
  if (type === 'received') {
    actionHtml = `
      <div class="conn-actions">
        <button class="btn btn-primary accept-btn" data-conn-id="${conn.connectionId}">Accept</button>
        <button class="btn btn-secondary decline-btn" data-conn-id="${conn.connectionId}">Decline</button>
      </div>
    `;
  } else if (type === 'sent') {
    actionHtml = `<span class="conn-status-badge badge-pending"><i class="fa-solid fa-hourglass"></i> Sent pending</span>`;
  } else if (type === 'accepted') {
    actionHtml = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <span class="conn-status-badge badge-accepted"><i class="fa-solid fa-check-double"></i> Connected Match</span>
        <a href="mailto:${user.email}" class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;"><i class="fa-solid fa-envelope"></i> Contact</a>
      </div>
    `;
  }

  div.innerHTML = `
    <img src="${user.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'}" class="conn-img" alt="${user.name}">
    <div class="conn-info">
      <h4>${user.name}</h4>
      <div class="conn-meta">
        <div>${user.age} yrs • ${user.religion} • ${user.location}</div>
        <div style="font-size:0.75rem; margin-top:2px;">Requested: ${timeStr}</div>
      </div>
      ${actionHtml}
    </div>
  `;

  // Attach event handlers
  const acceptBtn = div.querySelector('.accept-btn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => respondToRequest(conn.connectionId, 'accepted'));
  }

  const declineBtn = div.querySelector('.decline-btn');
  if (declineBtn) {
    declineBtn.addEventListener('click', () => respondToRequest(conn.connectionId, 'declined'));
  }

  return div;
}

// Respond (Accept / Decline) connection
async function respondToRequest(connectionId, status) {
  if (!config) return;
  
  try {
    const response = await fetch(`${config.connectionServiceUrl}/api/connections/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId, status })
    });

    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || `Error updating request`, 'error');
      return;
    }

    showToast(`Request ${status === 'accepted' ? 'accepted' : 'declined'} successfully!`, 'success');
    
    // Refresh connections data
    await fetchUserConnections();
    
    // Refresh connections panel if active
    const activeSection = document.querySelector('.app-section.active');
    if (activeSection && activeSection.id === 'connections-section') {
      loadConnectionsViews();
    } else {
      // Re-trigger load of current section
      loadDashboard();
    }

  } catch (error) {
    console.error(error);
    showToast('Failed to connect to Connection Service.', 'error');
  }
}

// Populate Edit Profile Fields
function populateProfileFields() {
  if (!currentUser) return;
  
  document.getElementById('edit-name').value = currentUser.name || '';
  document.getElementById('edit-location').value = currentUser.location || '';
  document.getElementById('edit-religion').value = currentUser.religion || '';
  document.getElementById('edit-mothertongue').value = currentUser.motherTongue || '';
  document.getElementById('edit-profession').value = currentUser.profession || '';
  document.getElementById('edit-education').value = currentUser.education || '';
  document.getElementById('edit-height').value = currentUser.height || "5'5\"";
  document.getElementById('edit-photo').value = currentUser.photoUrl || '';
  document.getElementById('edit-bio').value = currentUser.bio || '';
  
  document.getElementById('profile-edit-img').src = currentUser.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
}

// Toast Utility
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}" style="color: ${type === 'success' ? '#28a745' : '#dc3545'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}
