// Инициализация CoreSmart Scroll-to-Site
if (window.CoreSmartS2S) {
  CoreSmartS2S.init({
    linkToOpen: "https://ozon.onelink.me/SNMZ/m16ckhwg",
    linkToShow: "ozon.ru",
    previewImage: "https://gorenje.nativepage.ru/wp-content/uploads/sites/3/2026/05/gv663b62-desktop.jpg",
    previewImageMob: "https://gorenje.nativepage.ru/wp-content/uploads/sites/3/2026/05/gv663b62-mobile.jpg",
    minScrollPercent: 100
  });
  console.log('[CoreSmartS2S]', CoreSmartS2S);
}

// ==========================================================================
// ПОЛЬЗОВАТЕЛЬСКИЕ СОБЫТИЯ И АНАЛИТИКА
// ==========================================================================

let topThemeID = null;
let affID = document.querySelector('.cs-article') && document.querySelector('.cs-article').getAttribute('data-aff-id');

document.addEventListener('readPage', e => {
    ym(108780547, 'reachGoal', 'read_action');
    window.dispatchEvent(new CustomEvent('leadEvent', { detail: { index: 0 } }));
});

document.addEventListener('transferEvent', e => {
    ym(108780547, 'reachGoal', 's2s');
    
    if (topThemeID && affID) { 
        ym(108780547, 'reachGoal', `a${affID}_aff_${topThemeID}`); 
    }
    
    if ((affID == 3 && topThemeID == 1) || (affID == 2 && topThemeID == 2) || (affID == 2 && topThemeID == 3)) { 
        ym(108780547, 'reachGoal', 'a_group'); 
    }
    
    if ((affID == 3 && topThemeID == 2) || (affID == 1 && topThemeID == 4)) { 
        ym(108780547, 'reachGoal', 'b_group'); 
    }
    
    window.dispatchEvent(new CustomEvent('leadEvent', { detail: { index: 0 } }));
});

window.addEventListener('blockRangeChange', e => {
    topThemeID = parseInt(e.detail.topBlock.id);
});

window.addEventListener('beforeunload', e => {
    if (topThemeID && affID) { 
        ym(108780547, 'reachGoal', `a${affID}_aff_${topThemeID}`); 
    }
    
    if ((affID == 3 && topThemeID == 1) || (affID == 2 && topThemeID == 2) || (affID == 2 && topThemeID == 3)) { 
        ym(108780547, 'reachGoal', 'a_group'); 
    }
    
    if ((affID == 3 && topThemeID == 2) || (affID == 1 && topThemeID == 4)) { 
        ym(108780547, 'reachGoal', 'b_group'); 
    }
});