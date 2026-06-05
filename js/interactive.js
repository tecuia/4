// ============================================
// INTERACTIVE MECHANICS - CoreSmart Native
// Классы: Quiz, Randomizer, Tinder
// ============================================

(function(global) {
  'use strict';

  // ==========================================
  // КЛАСС QUIZ
  // ==========================================
  class Quiz {
    constructor(containerSelector, options = {}) {
      this.container = document.querySelector(containerSelector);
      if (!this.container) {
        console.warn(`Quiz: container "${containerSelector}" not found`);
        return;
      }
      
      this.options = {
        totalQuestions: 5,
        successDelay: 2000,
        ...options
      };
      
      this.state = {
        mechanicStarted: false,
        mechanicCompleted: false,
        quizActive: false,
        currentQuestion: 1,
        userAnswers: {},
        mainScrollTrigger: null,
        originalScrollBehavior: null,
        scrollBlocker: null,
        touchStartY: 0,
        minScrollY: 0
      };
      
      this.init();
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init() {
      this.cacheElements();
      this.hideDescription();
      this.initScrollAnimation();
      this.setupEventListeners();
    }
    
    cacheElements() {
      this.quizContent = this.container.querySelector('#quizContent');
      this.quizStartBtn = this.container.querySelector('#quizStartBtn');
      this.quizDescription = document.getElementById('quizDescription');
      this.allQuestionScreens = document.querySelectorAll('.quiz-question-screen');
      this.successBlock = this.container.querySelector('#successBlock');
      this.loadingSpinner = this.container.querySelector('#loadingSpinner');
      this.loadingText = this.container.querySelector('#loadingText');
      this.successCheck = this.container.querySelector('#successCheck');
      this.contentBefore = document.getElementById('contentBefore');
      this.contentAfter = document.getElementById('contentAfter');
      this.animationWrapper = document.querySelector('.animation-wrapper');
    }
    
    // ========== УПРАВЛЕНИЕ ВИДИМОСТЬЮ ==========
    hideContentBefore() {
      if (this.contentBefore) {
        this.contentBefore.style.transition = 'opacity 0.4s ease';
        this.contentBefore.style.opacity = '0';
        this.contentBefore.style.visibility = 'hidden';
        this.contentBefore.style.pointerEvents = 'none';
      }
    }
    
    showContentBefore() {
      if (this.contentBefore) {
        this.contentBefore.style.opacity = '1';
        this.contentBefore.style.visibility = 'visible';
        this.contentBefore.style.pointerEvents = 'auto';
      }
    }
    
    hideContentAfter() {
      if (this.contentAfter) {
        this.contentAfter.style.opacity = '0';
        this.contentAfter.style.visibility = 'hidden';
        this.contentAfter.style.pointerEvents = 'none';
      }
    }
    
    showContentAfter() {
      if (this.contentAfter) {
        this.contentAfter.style.opacity = '1';
        this.contentAfter.style.visibility = 'visible';
        this.contentAfter.style.pointerEvents = 'auto';
      }
    }
    
    // ========== УПРАВЛЕНИЕ СКРОЛЛОМ ==========
    disableScroll() {
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      this.state.originalScrollBehavior = {
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        paddingRight: document.body.style.paddingRight,
        scrollY: scrollY
      };
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('no-scroll');
    }
    
    enableScroll() {
      if (!this.state.originalScrollBehavior) return;
      
      const scrollY = this.state.originalScrollBehavior.scrollY || Math.abs(parseInt(document.body.style.top || '0'));
      
      document.body.style.position = this.state.originalScrollBehavior.position || '';
      document.body.style.top = this.state.originalScrollBehavior.top || '';
      document.body.style.width = this.state.originalScrollBehavior.width || '';
      document.body.style.paddingRight = this.state.originalScrollBehavior.paddingRight || '';
      document.body.classList.remove('no-scroll');
      
      this.state.originalScrollBehavior = null;
      
      if (!this.state.mechanicCompleted) {
        window.scrollTo(0, scrollY);
      }
    }
    
    setupScrollBlocker() {
      if (!this.contentAfter) return;
      
      this.state.minScrollY = this.contentAfter.offsetTop - 50;
      
      if (this.state.scrollBlocker) {
        this.cleanupScrollBlocker();
      }
      
      this.state.scrollBlocker = (e) => {
        if (window.scrollY < this.state.minScrollY) {
          window.scrollTo(0, this.state.minScrollY);
        }
      };
      
      const touchStart = (e) => {
        this.state.touchStartY = e.touches[0].clientY;
      };
      
      const touchBlocker = (e) => {
        if (window.scrollY <= this.state.minScrollY) {
          const touch = e.touches[0];
          if (this.state.touchStartY < touch.clientY && window.scrollY <= this.state.minScrollY) {
            e.preventDefault();
          }
        }
      };
      
      window.addEventListener('scroll', this.state.scrollBlocker, { passive: false });
      window.addEventListener('touchstart', touchStart, { passive: true });
      window.addEventListener('touchmove', touchBlocker, { passive: false });
      
      this.state.scrollBlocker.cleanup = () => {
        window.removeEventListener('scroll', this.state.scrollBlocker);
        window.removeEventListener('touchstart', touchStart);
        window.removeEventListener('touchmove', touchBlocker);
      };
    }
    
    cleanupScrollBlocker() {
      if (this.state.scrollBlocker && this.state.scrollBlocker.cleanup) {
        this.state.scrollBlocker.cleanup();
        this.state.scrollBlocker = null;
      }
    }
    
    // ========== АНИМАЦИЯ ПОЯВЛЕНИЯ ==========
    initScrollAnimation() {
      gsap.registerPlugin(ScrollTrigger);
      
      this.hideContentAfter();
      
      gsap.set(this.container, {
        width: "min(926px, 95vw)",
        height: "min(548px, 60vh)",
        borderRadius: "24px",
        force3D: true
      });
      
      const entryTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".animation-wrapper",
          start: "top 80%",
          end: "center center",
          scrub: 1.2
        }
      });
      
      entryTl.to(this.container, {
        width: "min(1430px, 95vw)",
        height: "min(846px, 85vh)",
        borderRadius: "16px",
        ease: "power1.inOut"
      });
      
      this.state.mainScrollTrigger = ScrollTrigger.create({
        trigger: ".animation-wrapper",
        start: "center center",
        end: "+=1500",
        pin: true,
        onEnter: () => {
          if (!this.state.mechanicStarted && !this.state.mechanicCompleted) {
            this.state.mechanicStarted = true;
            this.hideContentBefore();
            document.body.classList.add('quiz-active');
            this.disableScroll();
            entryTl.kill();
            gsap.set(this.container, {
              width: "min(1430px, 95vw)",
              height: "min(846px, 85vh)",
              borderRadius: "16px",
              clearProps: "transform"
            });
          }
        }
      });
    }
    
    // ========== УПРАВЛЕНИЕ ОПИСАНИЕМ ==========
    showDescription() {
      if (!this.quizDescription) return;
      this.state.quizActive = true;
      this.quizDescription.style.opacity = '1';
      this.quizDescription.style.visibility = 'visible';
    }
    
    hideDescription() {
      if (!this.quizDescription) return;
      this.state.quizActive = false;
      this.quizDescription.style.opacity = '0';
      this.quizDescription.style.visibility = 'hidden';
    }
    
    updateDescription(num) {
      if (!this.quizDescription || !this.state.quizActive) return;
      
      gsap.to(this.quizDescription, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          this.quizDescription.textContent = 'Большинство' + num + ' компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало';
          gsap.to(this.quizDescription, { opacity: 1, duration: 0.2 });
        }
      });
    }
    
    // ========== УПРАВЛЕНИЕ ВОПРОСАМИ ==========
    showQuestion(num) {
      this.state.currentQuestion = num;
      
      this.allQuestionScreens.forEach(screen => {
        screen.style.display = 'none';
      });
      
      const target = document.getElementById('quizQuestion' + num);
      if (target) {
        target.style.display = 'flex';
        gsap.fromTo(target, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        this.setupQuestionListeners(num);
        this.updateDescription(num);
      }
    }
    
    goToNextQuestion() {
      if (this.state.currentQuestion < this.options.totalQuestions) {
        this.showQuestion(this.state.currentQuestion + 1);
      } else {
        const currentScreen = document.getElementById('quizQuestion' + this.state.currentQuestion);
        if (currentScreen) {
          gsap.to(currentScreen, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
              currentScreen.style.display = 'none';
              this.finishMechanic();
            }
          });
        } else {
          this.finishMechanic();
        }
      }
    }
    
    goToPrevQuestion() {
      if (this.state.currentQuestion > 1) {
        this.showQuestion(this.state.currentQuestion - 1);
      }
    }
    
    handleStartClick() {
      if (!this.state.mechanicStarted) return;
      
      this.showDescription();
      
      if (this.quizContent) {
        gsap.to(this.quizContent, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            this.quizContent.style.display = 'none';
            this.showQuestion(1);
          }
        });
      }
    }
    
    setupQuestionListeners(num) {
      const qKey = 'q' + num;
      if (!this.state.userAnswers[qKey]) {
        this.state.userAnswers[qKey] = [];
      }
      
      // Настройка кнопок-ответов
      const answerBtns = document.querySelectorAll('#quizQuestion' + num + ' .quiz-answer-btn');
      answerBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
      });
      
      const freshBtns = document.querySelectorAll('#quizQuestion' + num + ' .quiz-answer-btn');
      freshBtns.forEach(btn => {
        if (this.state.userAnswers[qKey].includes(btn.dataset.answer)) {
          btn.classList.add('selected');
        }
        
        btn.addEventListener('click', () => {
          const answerVal = btn.dataset.answer;
          const arr = this.state.userAnswers[qKey];
          
          if (btn.classList.contains('selected')) {
            btn.classList.remove('selected');
            const idx = arr.indexOf(answerVal);
            if (idx > -1) arr.splice(idx, 1);
          } else {
            btn.classList.add('selected');
            if (!arr.includes(answerVal)) arr.push(answerVal);
          }
          
          this.updateNextButton(num);
        });
      });
      
      // Настройка фото-карточек
      const photoCards = document.querySelectorAll('#quizQuestion' + num + ' .quiz-photo-card');
      photoCards.forEach(card => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
      });
      
      const freshPhotoCards = document.querySelectorAll('#quizQuestion' + num + ' .quiz-photo-card');
      freshPhotoCards.forEach(card => {
        if (this.state.userAnswers[qKey].includes(card.dataset.answer)) {
          card.classList.add('selected');
        }
        
        card.addEventListener('click', () => {
          const answerVal = card.dataset.answer;
          const arr = this.state.userAnswers[qKey];
          
          if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            const idx = arr.indexOf(answerVal);
            if (idx > -1) arr.splice(idx, 1);
          } else {
            card.classList.add('selected');
            if (!arr.includes(answerVal)) arr.push(answerVal);
          }
          
          this.updateNextButton(num);
        });
      });
      
      this.updateNextButton(num);
      
      const backBtn = document.getElementById('quizNavBack' + num);
      if (backBtn) {
        const newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);
        const freshBackBtn = document.getElementById('quizNavBack' + num);
        
        if (freshBackBtn) {
          freshBackBtn.addEventListener('click', () => this.goToPrevQuestion());
          freshBackBtn.disabled = (num === 1);
        }
      }
      
      const nextBtn = document.getElementById('quizNavNext' + num);
      if (nextBtn) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        const freshNextBtn = document.getElementById('quizNavNext' + num);
        
        if (freshNextBtn) {
          freshNextBtn.addEventListener('click', () => this.goToNextQuestion());
        }
      }
    }
    
    updateNextButton(num) {
      const nextBtn = document.getElementById('quizNavNext' + num);
      const qKey = 'q' + num;
      
      if (nextBtn && this.state.userAnswers[qKey]) {
        nextBtn.disabled = (this.state.userAnswers[qKey].length === 0);
      }
    }
    
    // ========== ЗАВЕРШЕНИЕ МЕХАНИКИ ==========
    playExitAnimation() {
      const exitTl = gsap.timeline({
        onComplete: () => {
          this.state.mechanicCompleted = true;
          
          if (this.state.mainScrollTrigger) {
            this.state.mainScrollTrigger.kill();
          }
          
          this.showContentAfter();
          
          if (this.animationWrapper) {
            this.animationWrapper.style.display = 'none';
          }
          
          if (this.contentBefore) {
            this.contentBefore.style.display = 'none';
          }
          
          document.body.classList.remove('quiz-active');
          this.enableScroll();
          this.setupScrollBlocker();
          
          if (typeof CoreSmartS2S !== 'undefined') {
            CoreSmartS2S.init({
              linkToOpen: "https://inpool.ru/",
              linkToShow: "inpool.ru",
              previewImage: "./imgs/preview.png",
              previewImageMob: "./imgs/preview.png",
              minVisiblePercent: 0.8,
              redirectDelay: 400
            });
          }
          
          setTimeout(() => {
            if (this.contentAfter) {
              this.contentAfter.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      });
      
      exitTl
        .to(this.container, { height: "300px", duration: 0.8, ease: "power2.inOut" })
        .to(this.container, { y: "-120vh", opacity: 0, duration: 0.8, ease: "power2.in" }, "+=0.2");
    }
    
    finishMechanic() {
      this.hideDescription();
      this.successBlock.style.display = 'block';
      
      setTimeout(() => {
        gsap.to(this.loadingSpinner, { opacity: 0, duration: 0.3 });
        gsap.to(this.loadingText, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            this.loadingSpinner.style.display = 'none';
            this.loadingText.style.display = 'none';
            this.successCheck.style.display = 'block';
            
            gsap.fromTo("#whitePulse", { opacity: 0 }, {
              opacity: 0.6,
              duration: 0.25,
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut"
            });
            
            gsap.fromTo(this.successCheck, { scale: 0.5, opacity: 0 }, {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              ease: 'back.out(1.7)'
            });
            
            setTimeout(() => {
              this.playExitAnimation();
            }, 1200);
          }
        });
      }, 2000);
    }
    
    setupEventListeners() {
      if (this.quizStartBtn) {
        this.quizStartBtn.addEventListener('click', () => this.handleStartClick());
      }
    }
    
    resetMechanic() {
      this.state.mechanicCompleted = false;
      this.state.mechanicStarted = false;
      this.state.quizActive = false;
      this.state.currentQuestion = 1;
      this.state.userAnswers = {};
      
      this.cleanupScrollBlocker();
      this.showContentBefore();
      
      if (this.animationWrapper) {
        this.animationWrapper.style.display = '';
      }
      
      if (this.contentAfter) {
        this.contentAfter.style.opacity = '';
        this.contentAfter.style.visibility = '';
      }
      
      gsap.set(this.container, {
        y: 0,
        opacity: 1,
        height: "min(548px, 60vh)",
        width: "min(926px, 95vw)"
      });
      
      if (this.quizContent) {
        this.quizContent.style.display = '';
        this.quizContent.style.opacity = '1';
      }
      
      this.allQuestionScreens.forEach(s => {
        s.style.display = 'none';
        s.style.opacity = '0';
      });
      
      this.hideDescription();
      
      if (this.quizDescription) {
        this.quizDescription.textContent = 'Большинство1 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов. Эти показатели важны, но они описывают только начало';
      }
      
      this.successBlock.style.display = 'none';
      this.loadingSpinner.style.display = '';
      this.loadingSpinner.style.opacity = '1';
      this.loadingText.style.display = '';
      this.loadingText.style.opacity = '1';
      this.successCheck.style.display = 'none';
      
      document.body.classList.remove('quiz-active');
      ScrollTrigger.refresh();
    }
  }

  // ==========================================
  // КЛАСС RANDOMIZER
  // ==========================================
  class Randomizer {
    constructor(containerSelector, options = {}) {
      this.container = document.querySelector(containerSelector);
      if (!this.container) {
        console.warn(`Randomizer: container "${containerSelector}" not found`);
        return;
      }
      
      this.options = {
        loadingDelay: 2000,
        ...options
      };
      
      this.CONTENT_MAP = {
        park: {
          title: 'Топ-10 ЖК возле парков:',
          text: `<p>Жить возле зеленого парка или набережной, в экологически чистой обстановке, иметь возможность совершать утренние и вечерние пробежки рядом с домом, ежедневно гулять с детьми на свежем воздухе — это мечта каждого жителя мегаполиса. Экологичность стала модным трендом и девелоперы стремятся удовлетворить высокие требования клиентов с достатком. В сегодняшней Москве имеется достаточный выбор элитного жилья с необходимыми характеристиками.</p><p>№1 ЖК «Твид Парк». Расположен непосредственно на территории старинного парка Покровское-Стрешнево, на северо-западе Москвы, в 15 минутах от центра столицы. Малоэтажные кирпичные дома класса де-люкс в респектабельном английским стиле великолепно сочетаются с окружающим ландшафтом.</p>`
        },
        studio: {
          title: 'Студии в центре Москвы: Полный гид по выбору и покупке',
          text: `<p>Центр Москвы — это престиж, инфраструктура и жизнь в самом сердце столицы. Студии здесь пользуются особым спросом: у студентов, молодых специалистов, инвесторов и тех, кто ценит время и комфорт. Разбираемся, где искать, сколько стоит и на что обратить внимание.</p><p>Что такое студия и почему она популярна? Студия — это жилое помещение, где кухня и комната объединены в одно пространство, а отдельным помещением является только санузел.</p><p><strong>Тверской район</strong></p><ul class="cs-list"><li>Средняя цена: 15–30 млн ₽</li><li>Метро: Тверская, Пушкинская, Чеховская</li><li>Плюсы: Престиж, инфраструктура, история</li><li>Минусы: Высокие цены, шумные улицы</li></ul>`
        },
        default: {
          title: 'Как выбрать 1-2 комнатную квартиру для семьи',
          text: `<p>Семейная ипотека — одна из самых выгодных программ на российском рынке недвижимости. Ставки от 4,5% до 6% делают покупку квартиры доступной для семей с детьми. Разбираемся, как правильно подобрать жильё и не ошибиться с выбором.</p>`
        }
      };
      
      this.SPINNER_HTML = `<div class="loading-spinner" style="position: relative; width: 50px; height: 50px;">${Array.from({ length: 16 }, (_, i) => `<div class="dot" style="--i: ${i}; position: absolute; top: 22px; left: 22px; width: 6px; height: 6px; background: #000; border-radius: 50%; transform-origin: 3px 3px; transform: rotate(calc(22.5deg * ${i})) translate(0, -22px); animation: fadeDots 1.2s linear infinite; animation-delay: calc(-1.2s + (1.2s / 16 * ${i}));"></div>`).join('')}</div>`;
      
      this.state = {
        mechanicStarted: false,
        mechanicCompleted: false,
        selectedFilters: [],
        resultShown: false,
        isCollapsed: false,
        lastContentKey: 'default',
        isResubmitting: false,
        mainScrollTrigger: null,
        originalScrollBehavior: null,
        scrollBlocker: null,
        touchStartY: 0,
        minScrollY: 0
      };
      
      this.resultWrapper = null;
      this.loadingWrapper = null;
      this.overlaySpinner = null;
      
      this.init();
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init() {
      this.cacheElements();
      this.initFilters();
      this.initScrollAnimation();
      this.setupEventListeners();
    }
    
    cacheElements() {
      this.randomizerContent = document.getElementById('randomizerContent');
      this.randomizerTop = document.getElementById('randomizerTop');
      this.randomizerSubmitBtn = document.getElementById('randomizerSubmitBtn');
      this.randomizerLoading = document.getElementById('randomizerLoading');
      this.randomizerResult = document.getElementById('randomizerResult');
      this.randomizerCtaText = document.getElementById('randomizerCtaText');
      this.randomizerFiltersWrapper = document.getElementById('randomizerFiltersWrapper');
      this.contentBefore = document.getElementById('contentBefore');
      this.contentAfter = document.getElementById('contentAfter');
      this.animationWrapper = document.querySelector('.animation-wrapper');
    }
    
    // ========== УПРАВЛЕНИЕ ВИДИМОСТЬЮ ==========
    hideContentBefore() {
      if (this.contentBefore) {
        this.contentBefore.style.transition = 'opacity 0.4s ease';
        this.contentBefore.style.opacity = '0';
        this.contentBefore.style.visibility = 'hidden';
        this.contentBefore.style.pointerEvents = 'none';
      }
    }
    
    showContentBefore() {
      if (this.contentBefore) {
        this.contentBefore.style.opacity = '1';
        this.contentBefore.style.visibility = 'visible';
        this.contentBefore.style.pointerEvents = 'auto';
      }
    }
    
    hideContentAfter() {
      if (this.contentAfter) {
        this.contentAfter.style.opacity = '0';
        this.contentAfter.style.visibility = 'hidden';
        this.contentAfter.style.pointerEvents = 'none';
      }
    }
    
    showContentAfter() {
      if (this.contentAfter) {
        this.contentAfter.style.opacity = '1';
        this.contentAfter.style.visibility = 'visible';
        this.contentAfter.style.pointerEvents = 'auto';
      }
    }
    
    // ========== УПРАВЛЕНИЕ СКРОЛЛОМ ==========
    disableScroll() {
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      this.state.originalScrollBehavior = {
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        paddingRight: document.body.style.paddingRight,
        scrollY: scrollY
      };
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('no-scroll');
    }
    
    enableScroll() {
      if (!this.state.originalScrollBehavior) return;
      
      const scrollY = this.state.originalScrollBehavior.scrollY || Math.abs(parseInt(document.body.style.top || '0'));
      
      document.body.style.position = this.state.originalScrollBehavior.position || '';
      document.body.style.top = this.state.originalScrollBehavior.top || '';
      document.body.style.width = this.state.originalScrollBehavior.width || '';
      document.body.style.paddingRight = this.state.originalScrollBehavior.paddingRight || '';
      document.body.classList.remove('no-scroll');
      
      this.state.originalScrollBehavior = null;
      
      if (!this.state.mechanicCompleted) {
        window.scrollTo(0, scrollY);
      }
    }
    
    setupScrollBlockerWithValue(scrollLimit) {
      this.cleanupScrollBlocker();
      this.state.minScrollY = scrollLimit;
      
      this.state.scrollBlocker = (e) => {
        if (window.scrollY < this.state.minScrollY) {
          window.scrollTo(0, this.state.minScrollY);
        }
      };
      
      const touchStart = (e) => {
        this.state.touchStartY = e.touches[0].clientY;
      };
      
      const touchBlocker = (e) => {
        if (window.scrollY <= this.state.minScrollY) {
          const touch = e.touches[0];
          if (this.state.touchStartY < touch.clientY) {
            e.preventDefault();
          }
        }
      };
      
      window.addEventListener('scroll', this.state.scrollBlocker, { passive: false });
      window.addEventListener('touchstart', touchStart, { passive: true });
      window.addEventListener('touchmove', touchBlocker, { passive: false });
      
      this.state.scrollBlocker.cleanup = () => {
        window.removeEventListener('scroll', this.state.scrollBlocker);
        window.removeEventListener('touchstart', touchStart);
        window.removeEventListener('touchmove', touchBlocker);
      };
    }
    
    cleanupScrollBlocker() {
      if (this.state.scrollBlocker && this.state.scrollBlocker.cleanup) {
        this.state.scrollBlocker.cleanup();
        this.state.scrollBlocker = null;
      }
    }
    
    // ========== АНИМАЦИЯ ПОЯВЛЕНИЯ ==========
    initScrollAnimation() {
      gsap.registerPlugin(ScrollTrigger);
      
      this.hideContentAfter();
      this.showContentBefore();
      
      gsap.set(this.container, {
        width: "min(926px, 95vw)",
        height: "min(548px, 60vh)",
        borderRadius: "24px",
        force3D: true
      });
      
      const entryTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".animation-wrapper",
          start: "top 80%",
          end: "center center",
          scrub: 1.2
        }
      });
      
      entryTl.to(this.container, {
        width: "min(1380px, 95vw)",
        height: "min(489px, 80vh)",
        borderRadius: "16px",
        ease: "power1.inOut"
      });
      
      this.state.mainScrollTrigger = ScrollTrigger.create({
        trigger: ".animation-wrapper",
        start: "center center",
        end: "+=3000",
        pin: true,
        onEnter: () => {
          if (!this.state.mechanicStarted && !this.state.mechanicCompleted) {
            this.state.mechanicStarted = true;
            this.hideContentBefore();
            document.body.classList.add('randomizer-active');
            this.disableScroll();
            entryTl.kill();
            gsap.set(this.container, {
              width: "min(1380px, 95vw)",
              height: "min(489px, 80vh)",
              borderRadius: "16px",
              clearProps: "transform"
            });
          }
        }
      });
    }
    
    // ========== УПРАВЛЕНИЕ ФИЛЬТРАМИ ==========
    initFilters() {
      const filterButtons = this.container.querySelectorAll('.randomizer-filter-btn');
      
      filterButtons.forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          btn.classList.toggle('active');
          const filterValue = btn.dataset.filter;
          
          if (btn.classList.contains('active')) {
            if (!this.state.selectedFilters.includes(filterValue)) {
              this.state.selectedFilters.push(filterValue);
            }
          } else {
            this.state.selectedFilters = this.state.selectedFilters.filter(f => f !== filterValue);
          }
        };
      });
    }
    
    getContent() {
      if (this.state.selectedFilters.includes('studio')) return 'studio';
      if (this.state.selectedFilters.includes('park')) return 'park';
      return 'default';
    }
    
    // ========== УПРАВЛЕНИЕ РЕЗУЛЬТАТАМИ ==========
    ensureResultWrapper() {
      if (!this.resultWrapper) {
        this.resultWrapper = document.createElement('div');
        this.resultWrapper.className = 'randomizer-result-wrapper';
        this.resultWrapper.style.cssText = `max-width: 720px; width: 100%; margin: 30px auto 0; padding: 0 20px; box-sizing: border-box; position: relative; z-index: 5; opacity: 0;`;
        
        if (this.animationWrapper && this.container) {
          this.animationWrapper.insertBefore(this.resultWrapper, this.container.nextSibling);
        }
      }
      
      return this.resultWrapper;
    }
    
    ensureLoadingWrapper() {
      if (!this.loadingWrapper) {
        this.loadingWrapper = document.createElement('div');
        this.loadingWrapper.className = 'randomizer-loading-wrapper';
        this.loadingWrapper.style.cssText = `display: none; flex-direction: column; align-items: center; justify-content: center; width: 100%; margin-top: 20px; position: relative; z-index: 5;`;
        this.loadingWrapper.innerHTML = this.SPINNER_HTML;
        
        if (this.animationWrapper && this.container) {
          this.animationWrapper.insertBefore(this.loadingWrapper, this.container.nextSibling);
        }
      }
      
      return this.loadingWrapper;
    }
    
    showLoadingExternal() {
      const loader = this.ensureLoadingWrapper();
      loader.style.display = 'flex';
      
      gsap.fromTo(loader, { opacity: 0, y: 15 }, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out"
      });
    }
    
    hideLoadingExternal(callback) {
      const loader = this.ensureLoadingWrapper();
      
      gsap.to(loader, {
        opacity: 0,
        y: -10,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          loader.style.display = 'none';
          if (callback) callback();
        }
      });
    }
    
    showResubmitLoadingOnResult() {
      const wrapper = this.ensureResultWrapper();
      
      if (!this.overlaySpinner) {
        this.overlaySpinner = document.createElement('div');
        this.overlaySpinner.className = 'resubmit-spinner-overlay';
        this.overlaySpinner.innerHTML = this.SPINNER_HTML;
        this.overlaySpinner.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          pointer-events: none;
          display: none;
          position: absolute;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
        `;
      }
      
      if (this.overlaySpinner.parentNode) {
        this.overlaySpinner.parentNode.removeChild(this.overlaySpinner);
      }
      
      wrapper.parentNode.insertBefore(this.overlaySpinner, wrapper.nextSibling);
      this.positionOverlayOnWrapper();
      this.overlaySpinner.style.display = 'flex';
      
      gsap.fromTo(this.overlaySpinner, { opacity: 0 }, {
        opacity: 1,
        duration: 0.2,
        ease: "power2.out"
      });
    }
    
    positionOverlayOnWrapper() {
      if (!this.overlaySpinner || !this.resultWrapper) return;
      
      const wrapperRect = this.resultWrapper.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      this.overlaySpinner.style.position = 'absolute';
      this.overlaySpinner.style.top = (wrapperRect.top + scrollTop) + 'px';
      this.overlaySpinner.style.left = wrapperRect.left + 'px';
      this.overlaySpinner.style.width = wrapperRect.width + 'px';
      this.overlaySpinner.style.height = wrapperRect.height + 'px';
      this.overlaySpinner.style.borderRadius = window.getComputedStyle(this.resultWrapper).borderRadius;
    }
    
    hideResubmitLoadingOnResult(callback) {
      if (!this.overlaySpinner) {
        if (callback) callback();
        return;
      }
      
      gsap.to(this.overlaySpinner, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          if (this.overlaySpinner && this.overlaySpinner.parentNode) {
            this.overlaySpinner.parentNode.removeChild(this.overlaySpinner);
          }
          if (callback) callback();
        }
      });
    }
    
    updateExternalResult(wrapper) {
      const content = this.CONTENT_MAP[this.state.lastContentKey] || this.CONTENT_MAP.default;
      
      wrapper.innerHTML = `
        <h2 class="randomizer-result-title" style="font-family: 'Manrope', sans-serif; font-weight: 400; font-size: 32px; line-height: 120%; color: #000; margin-bottom: 16px;">
          ${content.title}
        </h2>
        <div class="randomizer-result-text" style="font-family: 'Manrope', sans-serif; font-weight: 300; font-size: 18px; line-height: 1.6; color: #333;">
          ${content.text}
        </div>
      `;
    }
    
    showResultWithLoading() {
      this.showLoadingExternal();
      
      setTimeout(() => {
        this.hideLoadingExternal(() => {
          this.collapseWindowForCompletion();
        });
      }, this.options.loadingDelay);
    }
    
    collapseWindowForCompletion() {
      this.state.isCollapsed = true;
      this.state.lastContentKey = this.getContent();
      
      const wrapper = this.ensureResultWrapper();
      this.updateExternalResult(wrapper);
      
      const tl = gsap.timeline({
        onComplete: () => {
          if (this.state.mainScrollTrigger) {
            this.state.mainScrollTrigger.kill();
            this.state.mainScrollTrigger = null;
          }
          
          this.showContentAfter();
          
          if (this.animationWrapper) {
            this.animationWrapper.style.display = 'none';
          }
          
          if (this.contentBefore) {
            this.contentBefore.style.display = 'none';
          }
          
          document.body.classList.remove('randomizer-active');
          
          if (this.contentAfter && this.container) {
            this.contentAfter.insertBefore(this.container, this.contentAfter.firstChild);
          }
          
          if (this.contentAfter && wrapper) {
            this.contentAfter.insertBefore(wrapper, this.contentAfter.children[1] || null);
          }
          
          if (this.loadingWrapper && this.contentAfter) {
            this.contentAfter.insertBefore(this.loadingWrapper, this.contentAfter.children[2] || null);
          }
          
          if (this.state.originalScrollBehavior) {
            document.body.style.position = this.state.originalScrollBehavior.position || '';
            document.body.style.top = this.state.originalScrollBehavior.top || '';
            document.body.style.width = this.state.originalScrollBehavior.width || '';
            document.body.style.paddingRight = this.state.originalScrollBehavior.paddingRight || '';
            document.body.classList.remove('no-scroll');
            this.state.originalScrollBehavior = null;
          }
          
          const targetY = this.contentAfter.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, targetY);
          this.setupScrollBlockerWithValue(targetY);
          
          if (typeof CoreSmartS2S !== 'undefined') {
            CoreSmartS2S.init({
              linkToOpen: "https://inpool.ru/",
              previewImage: "./imgs/preview.png",
              previewImageMob: "./imgs/previewMob.png",
              minVisiblePercent: 0.8,
              redirectDelay: 400
            });
          }
          
          this.state.resultShown = false;
          this.state.mechanicCompleted = true;
        }
      });
      
      tl.to(this.randomizerContent, {
        padding: "20px 20px",
        gap: "16px",
        duration: 0.4,
        ease: "power2.inOut"
      }, 0);
      
      tl.to(this.container, {
        height: "auto",
        width: "min(720px, 95vw)",
        borderRadius: "16px",
        duration: 0.5,
        ease: "power2.inOut"
      }, 0);
      
      tl.to(this.container, {
        scale: 1.01,
        duration: 0.15,
        ease: "power1.out"
      }, "-=0.1");
      
      tl.to(this.container, {
        scale: 1,
        duration: 0.15,
        ease: "power1.inOut"
      });
      
      gsap.set(wrapper, { opacity: 0, y: 20 });
      
      tl.to(wrapper, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
      }, "-=0.2");
    }
    
    // ========== ОБРАБОТКА ДЕЙСТВИЙ ПОЛЬЗОВАТЕЛЯ ==========
    handleResubmit() {
      if (this.state.isResubmitting || this.state.selectedFilters.length === 0) return;
      
      this.state.isResubmitting = true;
      
      const newContentKey = this.getContent();
      if (newContentKey === this.state.lastContentKey) {
        this.state.isResubmitting = false;
        return;
      }
      
      this.state.lastContentKey = newContentKey;
      
      const wrapper = this.ensureResultWrapper();
      
      // Применяем блюр к тексту результата
      const resultText = wrapper.querySelector('.randomizer-result-text');
      const resultTitle = wrapper.querySelector('.randomizer-result-title');
      
      if (resultText) {
        gsap.to(resultText, {
          filter: 'blur(4px)',
          opacity: 0.5,
          duration: 0.2,
          ease: "power2.out"
        });
      }
      
      if (resultTitle) {
        gsap.to(resultTitle, {
          filter: 'blur(4px)',
          opacity: 0.5,
          duration: 0.2,
          ease: "power2.out"
        });
      }
      
      // Показываем спиннер поверх
      this.showResubmitLoadingOnResult();
      
      setTimeout(() => {
        this.updateExternalResult(wrapper);
        
        this.hideResubmitLoadingOnResult(() => {
          // Убираем блюр после обновления контента
          const newResultText = wrapper.querySelector('.randomizer-result-text');
          const newResultTitle = wrapper.querySelector('.randomizer-result-title');
          
          if (newResultText) {
            gsap.to(newResultText, {
              filter: 'blur(0px)',
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          }
          
          if (newResultTitle) {
            gsap.to(newResultTitle, {
              filter: 'blur(0px)',
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          }
          
          this.state.isResubmitting = false;
        });
      }, this.options.loadingDelay);
    }
    
    handleSubmit() {
      if (!this.state.mechanicStarted || this.state.selectedFilters.length === 0 || this.state.resultShown) return;
      
      if (this.state.isCollapsed) {
        this.handleResubmit();
        return;
      }
      
      this.state.resultShown = true;
      
      gsap.to(this.randomizerCtaText, {
        y: -30,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in"
      });
      
      gsap.to(this.randomizerTop, {
        y: -20,
        opacity: 0,
        duration: 0.35,
        ease: "power2.in"
      });
      
      setTimeout(() => {
        this.showResultWithLoading();
      }, 250);
    }
    
    setupEventListeners() {
      if (this.randomizerSubmitBtn) {
        this.randomizerSubmitBtn.addEventListener('click', () => this.handleSubmit());
      }
      
      window.addEventListener('resize', () => {
        if (this.overlaySpinner && this.overlaySpinner.style.display === 'flex') {
          this.positionOverlayOnWrapper();
        }
      });
    }
    
    resetMechanic() {
      this.state.mechanicCompleted = false;
      this.state.mechanicStarted = false;
      this.state.selectedFilters = [];
      this.state.resultShown = false;
      this.state.isCollapsed = false;
      this.state.isResubmitting = false;
      this.state.lastContentKey = 'default';
      
      this.cleanupScrollBlocker();
      this.showContentBefore();
      
      const s2sContainer = document.querySelector('.cs-s2s-container');
      if (s2sContainer) s2sContainer.remove();
      
      if (this.animationWrapper && this.container) {
        this.animationWrapper.appendChild(this.container);
      }
      
      if (this.animationWrapper) {
        this.animationWrapper.style.display = '';
      }
      
      if (this.contentAfter) {
        this.contentAfter.style.opacity = '';
        this.contentAfter.style.visibility = '';
      }
      
      if (this.resultWrapper) {
        this.resultWrapper.remove();
        this.resultWrapper = null;
      }
      
      if (this.loadingWrapper) {
        this.loadingWrapper.remove();
        this.loadingWrapper = null;
      }
      
      if (this.overlaySpinner) {
        this.overlaySpinner.remove();
        this.overlaySpinner = null;
      }
      
      gsap.set(this.container, {
        y: 0,
        opacity: 1,
        height: "min(548px, 60vh)",
        width: "min(926px, 95vw)",
        minHeight: '',
        scale: 1,
        clearProps: "all"
      });
      
      gsap.set(this.randomizerContent, {
        padding: '',
        gap: '',
        clearProps: "all"
      });
      
      if (this.randomizerTop) {
        gsap.set(this.randomizerTop, {
          y: 0,
          opacity: 1,
          clearProps: "all"
        });
      }
      
      if (this.randomizerCtaText) {
        gsap.set(this.randomizerCtaText, {
          y: 0,
          opacity: 1,
          clearProps: "all"
        });
      }
      
      if (this.randomizerFiltersWrapper) {
        gsap.set(this.randomizerFiltersWrapper, {
          opacity: 1,
          y: 0,
          clearProps: "all"
        });
      }
      
      if (this.randomizerSubmitBtn) {
        gsap.set(this.randomizerSubmitBtn, {
          opacity: 1,
          clearProps: "all"
        });
      }
      
      this.container.querySelectorAll('.randomizer-filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      if (this.randomizerLoading) {
        this.randomizerLoading.classList.remove('active');
        gsap.set(this.randomizerLoading, {
          opacity: 0,
          y: 0,
          clearProps: "all"
        });
      }
      
      if (this.randomizerResult) {
        this.randomizerResult.classList.remove('active');
        this.randomizerResult.innerHTML = '';
        gsap.set(this.randomizerResult, {
          opacity: 0,
          y: 0,
          filter: 'blur(0px)',
          clearProps: "all"
        });
      }
      
      document.body.classList.remove('randomizer-active');
      
      if (this.state.mainScrollTrigger) {
        this.state.mainScrollTrigger.kill();
        this.state.mainScrollTrigger = null;
      }
      
      ScrollTrigger.refresh();
      this.initScrollAnimation();
    }
  }

  // ==========================================
  // КЛАСС TINDER
  // ==========================================
  class Tinder {
    constructor(containerSelector, options = {}) {
      this.container = document.querySelector(containerSelector);
      if (!this.container) {
        console.warn(`Tinder: container "${containerSelector}" not found`);
        return;
      }
      
      this.options = {
        stepTexts: ['Мои клиенты чаще покупают...', 'Мои клиенты чаще покупают...', 'Какие клиенты вам подходят?'],
        loadingDelay: 2000,
        ...options
      };
      
      this.state = {
        cardData: [],
        currentData: [],
        currentCard: null,
        results: [],
        isAnimating: false,
        mechanicStarted: false,
        mechanicCompleted: false,
        mainScrollTrigger: null,
        originalScrollBehavior: null,
        scrollBlocker: null,
        touchStartY: 0,
        minScrollY: 0,
        startX: 0,
        currentX: 0,
        isDragging: false,
        rAF_ID: null
      };
      
      this.init();
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    async init() {
      this.cacheElements();
      await this.loadData();
      this.initScrollAnimation();
    }
    
    cacheElements() {
      this.cardContainer = document.getElementById('cardContainer');
      this.dynamicText = document.getElementById('dynamicText');
      this.questionCounter = document.getElementById('questionCounter');
      this.successBlock = document.getElementById('successBlock');
      this.loadingSpinner = document.getElementById('loadingSpinner');
      this.loadingText = document.getElementById('loadingText');
      this.successCheck = document.getElementById('successCheck');
      this.contentBefore = document.getElementById('contentBefore');
      this.contentAfter = document.getElementById('contentAfter');
      this.cardDescriptionText = document.getElementById('cardDescriptionText');
      this.animationWrapper = document.querySelector('.animation-wrapper');
    }
    
    // ========== УПРАВЛЕНИЕ ВИДИМОСТЬЮ ==========
    hideContentBefore() {
      if (this.contentBefore) {
        this.contentBefore.style.transition = 'opacity 0.4s ease';
        this.contentBefore.style.opacity = '0';
        this.contentBefore.style.visibility = 'hidden';
        this.contentBefore.style.pointerEvents = 'none';
      }
    }
    
    showContentBefore() {
      if (this.contentBefore) {
        this.contentBefore.style.opacity = '1';
        this.contentBefore.style.visibility = 'visible';
        this.contentBefore.style.pointerEvents = 'auto';
      }
    }
    
    hideContentAfter() {
      if (this.contentAfter) {
        this.contentAfter.style.opacity = '0';
        this.contentAfter.style.visibility = 'hidden';
        this.contentAfter.style.pointerEvents = 'none';
      }
    }
    
    showContentAfter() {
      if (this.contentAfter) {
        this.contentAfter.style.opacity = '1';
        this.contentAfter.style.visibility = 'visible';
        this.contentAfter.style.pointerEvents = 'auto';
      }
    }
    
    // ========== УПРАВЛЕНИЕ СКРОЛЛОМ ==========
    disableScroll() {
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      this.state.originalScrollBehavior = {
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        paddingRight: document.body.style.paddingRight,
        scrollY: scrollY
      };
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('no-scroll');
    }
    
    enableScroll() {
      if (!this.state.originalScrollBehavior) return;
      
      const scrollY = this.state.originalScrollBehavior.scrollY || Math.abs(parseInt(document.body.style.top || '0'));
      
      document.body.style.position = this.state.originalScrollBehavior.position || '';
      document.body.style.top = this.state.originalScrollBehavior.top || '';
      document.body.style.width = this.state.originalScrollBehavior.width || '';
      document.body.style.paddingRight = this.state.originalScrollBehavior.paddingRight || '';
      document.body.classList.remove('no-scroll');
      
      this.state.originalScrollBehavior = null;
      
      if (!this.state.mechanicCompleted) {
        window.scrollTo(0, scrollY);
      }
    }
    
    setupScrollBlocker() {
      if (!this.contentAfter) return;
      
      this.state.minScrollY = this.contentAfter.offsetTop - 50;
      
      if (this.state.scrollBlocker) {
        this.cleanupScrollBlocker();
      }
      
      this.state.scrollBlocker = (e) => {
        if (window.scrollY < this.state.minScrollY) {
          window.scrollTo(0, this.state.minScrollY);
        }
      };
      
      const touchStart = (e) => {
        this.state.touchStartY = e.touches[0].clientY;
      };
      
      const touchBlocker = (e) => {
        if (window.scrollY <= this.state.minScrollY) {
          const touch = e.touches[0];
          if (this.state.touchStartY < touch.clientY) {
            e.preventDefault();
          }
        }
      };
      
      window.addEventListener('scroll', this.state.scrollBlocker, { passive: false });
      window.addEventListener('touchstart', touchStart, { passive: true });
      window.addEventListener('touchmove', touchBlocker, { passive: false });
      
      this.state.scrollBlocker.cleanup = () => {
        window.removeEventListener('scroll', this.state.scrollBlocker);
        window.removeEventListener('touchstart', touchStart);
        window.removeEventListener('touchmove', touchBlocker);
      };
    }
    
    cleanupScrollBlocker() {
      if (this.state.scrollBlocker && this.state.scrollBlocker.cleanup) {
        this.state.scrollBlocker.cleanup();
        this.state.scrollBlocker = null;
      }
    }
    
    // ========== ЗАГРУЗКА ДАННЫХ ==========
    async loadData() {
      try {
        const response = await fetch('./data.json');
        this.state.cardData = await response.json();
        this.loadCards();
      } catch (error) {
        console.warn('Data.json not found, using fallback:', error);
        
        this.state.cardData = [
          {
            name: "Дорогие товары(премиум)",
            image: "imgs/1_1.png",
            correct: true,
            type: "type-1",
            description: "Большинство1 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов."
          },
          {
            name: "Новинки и эксперементы",
            image: "imgs/2_1.png",
            correct: true,
            type: "type-1",
            description: "Большинство2 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов."
          },
          {
            name: "Товары по акции или скидке",
            image: "imgs/3_1.png",
            correct: true,
            type: "type-1",
            description: "Большинство3 компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов."
          }
        ];
        
        this.loadCards();
      }
    }
    
    // ========== АНИМАЦИЯ ПОЯВЛЕНИЯ ==========
    initScrollAnimation() {
      gsap.registerPlugin(ScrollTrigger);
      
      this.hideContentAfter();
      
      gsap.set(this.container, {
        width: "min(926px, 95vw)",
        height: "min(548px, 60vh)",
        borderRadius: "24px",
        force3D: true
      });
      
      const entryTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".animation-wrapper",
          start: "top 80%",
          end: "center center",
          scrub: 1.2
        }
      });
      
      entryTl.to(this.container, {
        width: "min(1430px, 95vw)",
        height: "min(846px, 85vh)",
        borderRadius: "16px",
        ease: "power1.inOut"
      });
      
      this.state.mainScrollTrigger = ScrollTrigger.create({
        trigger: ".animation-wrapper",
        start: "center center",
        end: "+=1500",
        pin: true,
        onEnter: () => {
          if (!this.state.mechanicStarted && !this.state.mechanicCompleted) {
            this.state.mechanicStarted = true;
            this.hideContentBefore();
            document.body.classList.add('tinder-active');
            this.disableScroll();
            entryTl.kill();
            gsap.set(this.container, {
              width: "min(1430px, 95vw)",
              height: "min(846px, 85vh)",
              borderRadius: "16px",
              clearProps: "transform"
            });
            this.loadCards();
          }
        }
      });
    }
    
    // ========== УПРАВЛЕНИЕ ОПИСАНИЕМ ==========
    updateDescriptionText(cardData) {
      if (!this.cardDescriptionText) return;
      
      gsap.to(this.cardDescriptionText, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          this.cardDescriptionText.textContent = cardData?.description || 'Большинство компаний по-прежнему оценивают эффективность маркетинга через привычные метрики: стоимость клика, охват, количество переходов.';
          
          gsap.to(this.cardDescriptionText, {
            opacity: 1,
            duration: 0.3
          });
        }
      });
    }
    
    // ========== ЗАВЕРШЕНИЕ МЕХАНИКИ ==========
    playExitAnimation() {
      const exitTl = gsap.timeline({
        onComplete: () => {
          this.state.mechanicCompleted = true;
          
          if (this.state.mainScrollTrigger) {
            this.state.mainScrollTrigger.kill();
          }
          
          this.showContentAfter();
          
          if (this.animationWrapper) {
            this.animationWrapper.style.display = 'none';
          }
          
          if (this.contentBefore) {
            this.contentBefore.style.display = 'none';
          }
          
          document.body.classList.remove('tinder-active');
          this.enableScroll();
          this.setupScrollBlocker();
          
          if (typeof CoreSmartS2S !== 'undefined') {
            CoreSmartS2S.init({
              linkToOpen: "https://inpool.ru/",
              linkToShow: "inpool.ru",
              previewImage: "./imgs/preview.png",
              previewImageMob: "./imgs/preview.png",
              minVisiblePercent: 0.8,
              redirectDelay: 400
            });
          }
          
          setTimeout(() => {
            if (this.contentAfter) {
              this.contentAfter.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      });
      
      exitTl
        .to(this.container, { height: "300px", duration: 0.8, ease: "power2.inOut" })
        .to(this.container, { y: "-120vh", opacity: 0, duration: 0.8, ease: "power2.in" }, "+=0.2");
    }
    
    // ========== УПРАВЛЕНИЕ КАРТОЧКАМИ ==========
    loadCards() {
      if (!this.cardContainer) return;
      
      this.cardContainer.innerHTML = '';
      this.state.currentData = [...this.state.cardData].reverse();
      this.state.results = [];
      
      this.state.currentData.forEach((item, index) => {
        const card = this.createCard(item, index);
        this.cardContainer.appendChild(card);
      });
      
      this.showNextCard();
      this.updateCounter();
    }
    
    createCard(item, index) {
      const card = document.createElement('div');
      card.className = 'tinder-card';
      card.dataset.index = index;
      card.dataset.type = item.type;
      card.style.zIndex = 1000 - index;
      card.style.opacity = '1';
      
      card.innerHTML = `
        <img class="tinder-card-img" src="${item.image}" alt="${item.name}" draggable="false">
        <div class="tinder-card-footer">
          <div class="tinder-card-name">${item.name}</div>
          <div class="tinder-card-actions">
            <button class="tinder-card-btn tinder-card-btn-nope" data-action="nope">
              <img src="./imgs/nope.png" alt="Nope">
            </button>
            <button class="tinder-card-btn tinder-card-btn-like" data-action="like">
              <img src="./imgs/like.png" alt="Like">
            </button>
          </div>
        </div>
      `;
      
      const nopeBtn = card.querySelector('[data-action="nope"]');
      const likeBtn = card.querySelector('[data-action="like"]');
      
      nopeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.state.isAnimating && this.state.mechanicStarted) {
          this.handleAnswer(false);
        }
      });
      
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.state.isAnimating && this.state.mechanicStarted) {
          this.handleAnswer(true);
        }
      });
      
      return card;
    }
    
    showNextCard() {
      const cards = document.querySelectorAll('.tinder-card');
      
      if (cards.length === 0) {
        this.finishMechanic();
        return;
      }
      
      this.state.currentCard = cards[cards.length - 1];
      this.updateCounter();
      
      const answered = this.state.currentData.length - cards.length;
      const step = Math.min(answered, this.options.stepTexts.length - 1);
      this.dynamicText.textContent = this.options.stepTexts[step];
      
      const currentCardData = this.state.currentData[this.state.currentData.length - cards.length];
      this.updateDescriptionText(currentCardData);
      
      Array.from(cards).reverse().forEach((card, idx) => {
        card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease';
        
        if (idx === 0) {
          card.style.transform = 'translateX(0) translateY(60px) scale(1.05) rotate(0deg)';
          card.style.zIndex = 1000;
          card.style.opacity = '1';
        } else if (idx === 1) {
          card.style.transform = 'translateX(-170px) translateY(30px) scale(0.85)';
          card.style.zIndex = 999;
          card.style.opacity = '1';
        } else if (idx === 2) {
          card.style.transform = 'translateX(170px) translateY(30px) scale(0.85)';
          card.style.zIndex = 998;
          card.style.opacity = '1';
        } else {
          card.style.transform = 'translateX(0) translateY(30px) scale(0.8)';
          card.style.opacity = '0';
          card.style.zIndex = 900 - idx;
        }
      });
      
      this.setupCardListeners(this.state.currentCard);
    }
    
    setupCardListeners(card) {
      card.removeEventListener('mousedown', this.onDragStart.bind(this));
      card.removeEventListener('touchstart', this.onDragStart.bind(this));
      
      card.addEventListener('mousedown', this.onDragStart.bind(this));
      
      document.removeEventListener('mousemove', this.onDragMove.bind(this));
      document.removeEventListener('mouseup', this.onDragEnd.bind(this));
      
      document.addEventListener('mousemove', this.onDragMove.bind(this));
      document.addEventListener('mouseup', this.onDragEnd.bind(this));
      
      card.addEventListener('touchstart', this.onDragStart.bind(this), { passive: true });
      card.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
      card.addEventListener('touchend', this.onDragEnd.bind(this));
    }
    
    onDragStart(e) {
      if (this.state.isAnimating) return;
      
      this.state.isDragging = true;
      this.state.startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
      this.state.currentCard.style.transition = 'none';
    }
    
    updateCardPosition() {
      if (this.state.currentCard && this.state.isDragging) {
        const rotate = this.state.currentX * 0.05;
        this.state.currentCard.style.transform = `translate3d(${this.state.currentX}px, 0, 0) rotate(${rotate}deg)`;
      }
      
      this.state.rAF_ID = null;
    }
    
    onDragMove(e) {
      if (!this.state.isDragging || this.state.isAnimating) return;
      if (!e.type.includes('mouse') && e.cancelable) e.preventDefault();
      
      this.state.currentX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - this.state.startX;
      
      if (!this.state.rAF_ID) {
        this.state.rAF_ID = requestAnimationFrame(this.updateCardPosition.bind(this));
      }
    }
    
    onDragEnd() {
      if (!this.state.isDragging || this.state.isAnimating) return;
      
      this.state.isDragging = false;
      
      if (this.state.rAF_ID) {
        cancelAnimationFrame(this.state.rAF_ID);
        this.state.rAF_ID = null;
      }
      
      if (Math.abs(this.state.currentX) > 100) {
        this.handleAnswer(this.state.currentX > 0);
      } else {
        this.state.currentCard.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease';
        this.state.currentCard.style.transform = 'translateX(0) translateY(0) scale(1) rotate(0deg)';
      }
      
      this.state.startX = 0;
      this.state.currentX = 0;
    }
    
    handleAnswer(isLike) {
      if (this.state.isAnimating) return;
      
      this.state.isAnimating = true;
      
      const moveX = isLike ? window.innerWidth : -window.innerWidth;
      const rotate = isLike ? 20 : -20;
      
      this.state.currentCard.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease';
      this.state.currentCard.style.transform = `translateX(${moveX}px) translateY(20px) rotate(${rotate}deg)`;
      this.state.currentCard.style.opacity = '0';
      
      this.state.results.push({
        type: this.state.currentCard.dataset.type,
        answer: isLike
      });
      
      setTimeout(() => {
        if (this.state.currentCard.parentNode) {
          this.state.currentCard.parentNode.removeChild(this.state.currentCard);
        }
        this.state.isAnimating = false;
        this.showNextCard();
      }, 400);
    }
    
    finishMechanic() {
      if (this.cardContainer) {
        this.cardContainer.style.display = 'none';
      }
      
      const buttonsContainer = this.container.querySelector('.tinder-buttons');
      if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
      }
      
      if (this.questionCounter) {
        this.questionCounter.style.display = 'none';
      }
      
      if (this.dynamicText) {
        this.dynamicText.style.display = 'none';
      }
      
      if (this.cardDescriptionText) {
        gsap.to(this.cardDescriptionText, { opacity: 0, duration: 0.3 });
      }
      
      if (this.successBlock) {
        this.successBlock.style.display = 'block';
      }
      
      this.determineWinner();
      
      setTimeout(() => {
        gsap.to(this.loadingSpinner, { opacity: 0, duration: 0.3 });
        gsap.to(this.loadingText, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            this.loadingSpinner.style.display = 'none';
            this.loadingText.style.display = 'none';
            
            if (this.successCheck) {
              this.successCheck.style.display = 'block';
            }
            
            gsap.fromTo("#whitePulse", { opacity: 0 }, {
              opacity: 0.6,
              duration: 0.25,
              yoyo: true,
              repeat: 1,
              ease: "power1.inOut"
            });
            
            gsap.fromTo(this.successCheck, { scale: 0.5, opacity: 0 }, {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              ease: 'back.out(1.7)'
            });
            
            setTimeout(() => {
              this.playExitAnimation();
            }, 1200);
          }
        });
      }, this.options.loadingDelay);
    }
    
    determineWinner() {
      const typeCounts = {
        'type-1': 0,
        'type-2': 0,
        'type-3': 0
      };
      
      this.state.results.forEach(r => {
        if (r.answer) {
          typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
        }
      });
      
      let maxType = 'type-1';
      let maxCount = 0;
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxType = type;
        }
      });
      
      console.log('Механика завершена! Выбран тип:', maxType);
      return maxType;
    }
    
    updateCounter() {
      const answered = this.state.currentData.length - document.querySelectorAll('.tinder-card').length;
      
      if (this.questionCounter) {
        this.questionCounter.textContent = `${answered}/${this.state.currentData.length}`;
      }
    }
    
    resetMechanic() {
      this.state.mechanicCompleted = false;
      this.state.mechanicStarted = false;
      
      this.cleanupScrollBlocker();
      this.showContentBefore();
      
      if (this.animationWrapper) {
        this.animationWrapper.style.display = '';
      }
      
      if (this.cardDescriptionText) {
        this.cardDescriptionText.style.opacity = '0';
        this.cardDescriptionText.style.visibility = 'hidden';
      }
      
      gsap.set(this.container, {
        y: 0,
        opacity: 1,
        height: "min(548px, 60vh)",
        width: "min(926px, 95vw)"
      });
      
      if (this.cardContainer) {
        this.cardContainer.style.display = '';
      }
      
      const buttonsContainer = this.container.querySelector('.tinder-buttons');
      if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
      }
      
      if (this.questionCounter) {
        this.questionCounter.style.display = '';
      }
      
      if (this.dynamicText) {
        this.dynamicText.style.display = '';
      }
      
      if (this.successBlock) {
        this.successBlock.style.display = 'none';
      }
      
      if (this.loadingSpinner) {
        this.loadingSpinner.style.display = '';
        this.loadingSpinner.style.opacity = '1';
      }
      
      if (this.loadingText) {
        this.loadingText.style.display = '';
        this.loadingText.style.opacity = '1';
      }
      
      if (this.successCheck) {
        this.successCheck.style.display = 'none';
      }
      
      document.body.classList.remove('tinder-active');
      ScrollTrigger.refresh();
      this.loadCards();
    }
  }

  // ==========================================
  // EXPORT TO GLOBAL
  // ==========================================
  global.Quiz = Quiz;
  global.Randomizer = Randomizer;
  global.Tinder = Tinder;

})(window);