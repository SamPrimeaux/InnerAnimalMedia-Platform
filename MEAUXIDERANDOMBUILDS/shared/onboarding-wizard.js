/**
 * Onboarding Wizard Engine (Shopify-like)
 * Step-by-step onboarding flow with state management
 */

(function () {
  'use strict';

  const OnboardingWizard = {
    currentStep: 0,
    steps: [],
    tenantId: null,
    wizardData: {},
    locale: localStorage.getItem('locale') || navigator.language || 'en',
    translations: {
      en: {
        welcome: 'Welcome to InnerAnimalMedia',
        subtitle: "Let's get you set up",
        step: 'Step',
        of: 'of',
        back: 'Back',
        continue: 'Continue',
        finish: 'Finish',
        skip: 'Skip for now',
        loading: 'Loading onboarding...',
        emailRequired: 'Email is required to continue',
        emailInvalid: 'Please enter a valid email address',
        workspaceName: 'Workspace Name',
        workspaceType: 'Workspace Type',
        personal: 'Personal',
        company: 'Company',
        nonprofit: 'Nonprofit',
        createNew: 'Create New Workspace',
        joinExisting: 'Join Existing Workspace',
        startFresh: 'Start fresh with a new workspace',
        joinInvited: 'Join a workspace you\'ve been invited to',
        welcomeMessage: 'Welcome to InnerAnimalMedia!',
        workspaceReady: 'Your workspace is set up and ready to go. Let\'s get you to your dashboard.',
        getStarted: 'Get Started',
        learnMore: 'Learn More',
        inviteTeam: 'Invite Team',
        createFirstProject: 'Create your first project',
        readDocumentation: 'Read the documentation',
        addCollaborators: 'Add collaborators'
      },
      es: {
        welcome: 'Bienvenido a InnerAnimalMedia',
        subtitle: 'Vamos a configurarte',
        step: 'Paso',
        of: 'de',
        back: 'Atrás',
        continue: 'Continuar',
        finish: 'Finalizar',
        skip: 'Omitir por ahora',
        loading: 'Cargando configuración inicial...',
        emailRequired: 'El correo electrónico es obligatorio para continuar',
        emailInvalid: 'Por favor ingresa un correo electrónico válido',
        workspaceName: 'Nombre del Espacio de Trabajo',
        workspaceType: 'Tipo de Espacio de Trabajo',
        personal: 'Personal',
        company: 'Empresa',
        nonprofit: 'Sin Fines de Lucro',
        createNew: 'Crear Nuevo Espacio de Trabajo',
        joinExisting: 'Unirse a un Espacio de Trabajo Existente',
        startFresh: 'Empezar de cero con un nuevo espacio de trabajo',
        joinInvited: 'Unirse a un espacio de trabajo al que has sido invitado',
        welcomeMessage: '¡Bienvenido a InnerAnimalMedia!',
        workspaceReady: 'Tu espacio de trabajo está configurado y listo. Vamos a llevarte a tu panel de control.',
        getStarted: 'Comenzar',
        learnMore: 'Aprender Más',
        inviteTeam: 'Invitar Equipo',
        createFirstProject: 'Crea tu primer proyecto',
        readDocumentation: 'Lee la documentación',
        addCollaborators: 'Agregar colaboradores'
      }
    },
    t(key) {
      return this.translations[this.locale]?.[key] || this.translations.en[key] || key;
    },
    setLocale(locale) {
      this.locale = locale;
      localStorage.setItem('locale', locale);
      this.renderStep();
    },

    async init(tenantId) {
      this.tenantId = tenantId || 'default-tenant';

      // Load step definitions
      await this.loadSteps();

      // Load current onboarding state
      await this.loadState();

      // Check if onboarding should be shown
      if (this.shouldShowOnboarding()) {
        this.show();
      }
    },

    async loadSteps() {
      try {
        const response = await fetch(`${window.location.origin}/api/onboarding/steps`);
        const data = await response.json();
        if (data.success) {
          this.steps = data.data || [];
          this.steps.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }
      } catch (error) {
        console.error('Failed to load onboarding steps:', error);
      }
    },

    async loadState() {
      try {
        const response = await fetch(`${window.location.origin}/api/onboarding?tenant_id=${this.tenantId}`);
        const data = await response.json();
        if (data.success && data.data.steps) {
          // Find first incomplete step
          const incompleteStep = data.data.steps.find(step => step.status !== 'completed');
          if (incompleteStep) {
            const stepIndex = this.steps.findIndex(s => s.step_key === incompleteStep.step_key);
            this.currentStep = stepIndex >= 0 ? stepIndex : 0;
          } else {
            // All steps completed
            this.currentStep = this.steps.length - 1;
          }

          // Load wizard data from meta_json
          data.data.steps.forEach(step => {
            if (step.meta_json) {
              try {
                this.wizardData[step.step_key] = JSON.parse(step.meta_json);
              } catch (e) {
                this.wizardData[step.step_key] = {};
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      }
    },

    shouldShowOnboarding() {
      // Check if onboarding is completed
      const activationStatus = localStorage.getItem('onboarding_completed');
      return !activationStatus || activationStatus === 'false';
    },

    show() {
      // Apply saved theme if exists
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        if (savedTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', prefersDark);
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
          document.documentElement.classList.toggle('dark', savedTheme === 'dark');
          document.documentElement.setAttribute('data-theme', savedTheme);
        }
      }
      
      const modal = document.getElementById('onboarding-modal');
      if (modal) {
        modal.classList.remove('hidden');
        this.renderStep();
      } else {
        this.createModal();
      }
    },

    hide() {
      const modal = document.getElementById('onboarding-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    },

    createModal() {
      const modal = document.createElement('div');
      modal.id = 'onboarding-modal';
      modal.className = 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
      modal.innerHTML = `
        <style>
          #onboarding-modal input[type="text"],
          #onboarding-modal input[type="email"],
          #onboarding-modal input[type="tel"],
          #onboarding-modal input[type="password"],
          #onboarding-modal textarea,
          #onboarding-modal select {
            color: #ffffff !important;
            background-color: rgba(0, 0, 0, 0.6) !important;
            border-color: rgba(255, 255, 255, 0.15) !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
          #onboarding-modal input[type="text"]::placeholder,
          #onboarding-modal input[type="email"]::placeholder,
          #onboarding-modal input[type="tel"]::placeholder,
          #onboarding-modal input[type="password"]::placeholder,
          #onboarding-modal textarea::placeholder {
            color: rgba(161, 161, 170, 0.7) !important;
            opacity: 1 !important;
          }
          #onboarding-modal input[type="text"]:focus,
          #onboarding-modal input[type="email"]:focus,
          #onboarding-modal input[type="tel"]:focus,
          #onboarding-modal input[type="password"]:focus,
          #onboarding-modal textarea:focus,
          #onboarding-modal select:focus {
            color: #ffffff !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            border-color: #ff6b00 !important;
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1) !important;
          }
          #onboarding-modal select {
            cursor: pointer !important;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E") !important;
            background-repeat: no-repeat !important;
            background-position: right 12px center !important;
            background-size: 12px !important;
            padding-right: 40px !important;
          }
          #onboarding-modal select option {
            background-color: #171717 !important;
            color: #ffffff !important;
            padding: 12px !important;
          }
          #onboarding-modal select option:checked,
          #onboarding-modal select option:focus,
          #onboarding-modal select option:hover {
            background-color: #ff6b00 !important;
            color: #ffffff !important;
          }
        </style>
        <div class="bg-brand-surface border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar" style="background-color: #171717;">
          <!-- Modal Header -->
          <div class="sticky top-0 bg-brand-panel border-b border-white/10 p-6 flex items-center justify-between" style="background-color: #0a0a0f;">
            <div class="flex items-center gap-4">
              <img src="https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/17535395-1501-490a-ff3d-e43d7c16a000/avatar" 
                   alt="InnerAnimalMedia" 
                   class="w-12 h-12 rounded-xl shrink-0 shadow-lg object-cover">
              <div>
                <h2 class="text-2xl font-bold text-white" id="wizard-title">${OnboardingWizard.t('welcome')}</h2>
                <p class="text-sm text-zinc-400 mt-1" id="wizard-subtitle">${OnboardingWizard.t('subtitle')}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <select id="locale-selector" onchange="OnboardingWizard.setLocale(this.value)" 
                class="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-orange"
                style="color: #ffffff !important; background-color: rgba(0, 0, 0, 0.6) !important; border-color: rgba(255, 255, 255, 0.15) !important;">
                <option value="en" ${OnboardingWizard.locale === 'en' ? 'selected' : ''}>English</option>
                <option value="es" ${OnboardingWizard.locale === 'es' ? 'selected' : ''}>Español</option>
              </select>
              <button onclick="OnboardingWizard.hide()" class="p-2 rounded-lg hover:bg-brand-surface transition-colors text-zinc-400 hover:text-white">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="px-6 pt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-zinc-400"><span id="step-label">${OnboardingWizard.t('step')}</span> <span id="current-step-num">1</span> ${OnboardingWizard.t('of')} <span id="total-steps">8</span></span>
              <span class="text-xs font-medium text-zinc-400"><span id="progress-percent">0</span>%</span>
            </div>
            <div class="w-full bg-black/40 rounded-full h-2 overflow-hidden">
              <div id="progress-bar" class="h-full bg-gradient-to-r from-brand-orange to-red-500 transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>

          <!-- Step Content -->
          <div id="wizard-content" class="p-6 min-h-[400px]">
            <div class="text-center py-12">
              <i data-lucide="loader" class="w-8 h-8 mx-auto mb-4 animate-spin text-brand-orange"></i>
              <div class="text-zinc-400">${OnboardingWizard.t('loading')}</div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="sticky bottom-0 bg-brand-panel border-t border-white/10 p-6 flex items-center justify-between" style="background-color: #0a0a0f;">
            <button id="wizard-back" onclick="OnboardingWizard.previousStep()" class="px-4 py-2 rounded-lg border border-white/10 hover:bg-brand-surface transition-colors text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <i data-lucide="arrow-left" class="w-4 h-4 inline mr-2"></i> <span id="back-text">${OnboardingWizard.t('back')}</span>
            </button>
            <div class="flex items-center gap-3">
              <button id="wizard-skip" onclick="OnboardingWizard.skipStep()" class="px-4 py-2 rounded-lg border border-white/10 hover:bg-brand-surface transition-colors text-zinc-400 text-sm hidden">
                <span id="skip-text">${OnboardingWizard.t('skip')}</span>
              </button>
              <button id="wizard-next" onclick="OnboardingWizard.nextStep()" class="px-6 py-2 rounded-lg bg-brand-orange text-white hover:bg-orange-600 transition-colors font-medium">
                <span id="next-text">${OnboardingWizard.t('continue')}</span> <i data-lucide="arrow-right" class="w-4 h-4 inline ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      lucide.createIcons();
      this.renderStep();
    },

    renderStep() {
      if (!this.steps || this.steps.length === 0) return;

      const step = this.steps[this.currentStep];
      if (!step) return;

      // Update progress
      const progress = ((this.currentStep + 1) / this.steps.length) * 100;
      document.getElementById('progress-bar').style.width = `${progress}%`;
      document.getElementById('current-step-num').textContent = this.currentStep + 1;
      document.getElementById('total-steps').textContent = this.steps.length;
      document.getElementById('progress-percent').textContent = Math.round(progress);
      document.getElementById('step-label').textContent = this.t('step');

      // Update title and subtitle
      document.getElementById('wizard-title').textContent = step.title || this.t('welcome');
      document.getElementById('wizard-subtitle').textContent = step.description || this.t('subtitle');

      // Update buttons
      const backBtn = document.getElementById('wizard-back');
      const nextBtn = document.getElementById('wizard-next');
      const skipBtn = document.getElementById('wizard-skip');
      const backText = document.getElementById('back-text');
      const nextText = document.getElementById('next-text');
      const skipText = document.getElementById('skip-text');

      backBtn.disabled = this.currentStep === 0;
      if (backText) backText.textContent = this.t('back');
      if (skipText) skipText.textContent = this.t('skip');

      if (this.currentStep === this.steps.length - 1) {
        if (nextText) {
          nextText.textContent = this.t('finish');
          nextBtn.innerHTML = `${this.t('finish')} <i data-lucide="check" class="w-4 h-4 inline ml-2"></i>`;
        }
      } else {
        if (nextText) {
          nextText.textContent = this.t('continue');
          nextBtn.innerHTML = `${this.t('continue')} <i data-lucide="arrow-right" class="w-4 h-4 inline ml-2"></i>`;
        }
      }
      
      // Update locale selector
      const localeSelector = document.getElementById('locale-selector');
      if (localeSelector) {
        localeSelector.value = this.locale;
      }

      // Show/hide skip button
      if (step.required === 0) {
        skipBtn.classList.remove('hidden');
      } else {
        skipBtn.classList.add('hidden');
      }

      // Render step content
      const content = document.getElementById('wizard-content');
      content.innerHTML = this.getStepContent(step);
      lucide.createIcons();

      // Re-attach event listeners for all form inputs (with enhanced styling)
      setTimeout(() => {
        // Apply enhanced styles to all inputs and selects in modal
        const allInputs = document.querySelectorAll('#onboarding-modal input[type="text"], #onboarding-modal input[type="email"], #onboarding-modal input[type="tel"], #onboarding-modal textarea');
        allInputs.forEach(input => {
          input.style.color = '#ffffff';
          input.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          input.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        });

        const allSelects = document.querySelectorAll('#onboarding-modal select');
        allSelects.forEach(select => {
          select.style.color = '#ffffff';
          select.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          select.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        });

        // Auth step: email and name
        if (step.step_key === 'auth') {
          const emailInput = document.getElementById('user-email');
          const nameInput = document.getElementById('user-name');

          if (emailInput) {
            emailInput.style.color = '#ffffff';
            emailInput.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            emailInput.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            emailInput.addEventListener('input', (e) => {
              this.wizardData.auth = this.wizardData.auth || {};
              this.wizardData.auth.email = e.target.value.trim();
            });
          }

          if (nameInput) {
            nameInput.style.color = '#ffffff';
            nameInput.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            nameInput.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            nameInput.addEventListener('input', (e) => {
              this.wizardData.auth = this.wizardData.auth || {};
              this.wizardData.auth.name = e.target.value.trim();
            });
          }
        }

        // Create tenant step: workspace name and type
        if (step.step_key === 'create_tenant') {
          const workspaceNameInput = document.getElementById('workspace-name');
          const workspaceTypeSelect = document.getElementById('workspace-type-select');

          if (workspaceNameInput) {
            workspaceNameInput.style.color = '#ffffff';
            workspaceNameInput.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            workspaceNameInput.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            // Restore value from wizardData if exists
            if (this.wizardData.create_tenant?.workspace_name) {
              workspaceNameInput.value = this.wizardData.create_tenant.workspace_name;
            }
            workspaceNameInput.addEventListener('input', (e) => {
              this.wizardData.create_tenant = this.wizardData.create_tenant || {};
              this.wizardData.create_tenant.workspace_name = e.target.value.trim();
            });
          }

          if (workspaceTypeSelect) {
            workspaceTypeSelect.style.color = '#ffffff';
            workspaceTypeSelect.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            workspaceTypeSelect.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            // Restore value from wizardData if exists
            if (this.wizardData.create_tenant?.workspace_type_select) {
              workspaceTypeSelect.value = this.wizardData.create_tenant.workspace_type_select;
            }
            workspaceTypeSelect.addEventListener('change', (e) => {
              this.wizardData.create_tenant = this.wizardData.create_tenant || {};
              this.wizardData.create_tenant.workspace_type_select = e.target.value;
            });
          }
        }
      }, 150);

      // Note: Event listeners are now attached in the main setTimeout above
      // This duplicate section has been removed to avoid conflicts
    },

    getStepContent(step) {
      const stepKey = step.step_key;
      const stepData = this.wizardData[stepKey] || {};

      switch (stepKey) {
        case 'auth':
          return this.renderAuthStep(step, stepData);
        case 'create_tenant':
          return this.renderWorkspaceStep(step, stepData);
        case 'choose_preset':
          return this.renderPresetStep(step, stepData);
        case 'choose_modules':
          return this.renderModulesStep(step, stepData);
        case 'brand_setup':
          return this.renderBrandStep(step, stepData);
        case 'domain_setup':
          return this.renderDomainStep(step, stepData);
        case 'invite_team':
          return this.renderTeamStep(step, stepData);
        case 'finish':
          return this.renderFinishStep(step, stepData);
        default:
          return `<div class="text-center py-12"><p class="text-brand-text-secondary">Step: ${step.title}</p></div>`;
      }
    },

    renderAuthStep(step, data) {
      return `
        <div class="space-y-6">
          <div class="text-center mb-8">
            <img src="https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/17535395-1501-490a-ff3d-e43d7c16a000/avatar" 
                 alt="InnerAnimalMedia" 
                 class="w-20 h-20 rounded-xl mx-auto mb-4 shadow-lg object-cover">
            <h3 class="text-xl font-bold text-white mb-2">${this.t('welcome')}</h3>
            <p class="text-zinc-400">Sign up or sign in to get started</p>
          </div>
          
          <!-- Email Collection Form -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-white mb-2">Email Address *</label>
              <input type="email" id="user-email" placeholder="you@example.com" value="${data.email || ''}" required
                style="color: white !important; background-color: rgba(0, 0, 0, 0.4) !important; border-color: rgba(255, 255, 255, 0.1) !important;"
                class="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-white mb-2">Full Name</label>
              <input type="text" id="user-name" placeholder="Your Name" value="${data.name || ''}"
                style="color: white !important; background-color: rgba(0, 0, 0, 0.4) !important; border-color: rgba(255, 255, 255, 0.1) !important;"
                class="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all">
            </div>
          </div>

          <div class="relative flex items-center py-4">
            <div class="flex-1 border-t border-white/10"></div>
            <span class="px-4 text-sm text-zinc-500">or</span>
            <div class="flex-1 border-t border-white/10"></div>
          </div>

          <div class="space-y-3">
            <button onclick="OnboardingWizard.handleAuth('github')" class="w-full flex items-center justify-center gap-3 px-6 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white">
              <i data-lucide="github" class="w-5 h-5"></i>
              <span>Continue with GitHub</span>
            </button>
            <button onclick="OnboardingWizard.handleAuth('google')" class="w-full flex items-center justify-center gap-3 px-6 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white">
              <i data-lucide="mail" class="w-5 h-5"></i>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      `;
    },

    renderWorkspaceStep(step, data) {
      return `
        <div class="space-y-6">
          <h3 class="text-lg font-bold text-white mb-4">Create or Join Workspace</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="OnboardingWizard.selectWorkspaceType('new')" class="p-6 border-2 rounded-xl hover:border-brand-orange transition-all text-left ${data.workspace_type === 'new' ? 'border-brand-orange bg-orange-500/10' : 'border-white/10 bg-brand-surface'}">
              <i data-lucide="plus-circle" class="w-8 h-8 text-brand-orange mb-3"></i>
              <h4 class="font-bold text-white mb-2">Create New Workspace</h4>
              <p class="text-sm text-zinc-400">Start fresh with a new workspace</p>
            </button>
            <button onclick="OnboardingWizard.selectWorkspaceType('existing')" class="p-6 border-2 rounded-xl hover:border-brand-orange transition-all text-left ${data.workspace_type === 'existing' ? 'border-brand-orange bg-orange-500/10' : 'border-white/10 bg-brand-surface'}">
              <i data-lucide="users" class="w-8 h-8 text-blue-400 mb-3"></i>
              <h4 class="font-bold text-white mb-2">Join Existing Workspace</h4>
              <p class="text-sm text-zinc-400">Join a workspace you've been invited to</p>
            </button>
          </div>
          ${data.workspace_type === 'new' ? `
            <div class="mt-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-white mb-2">Workspace Name</label>
                <input type="text" id="workspace-name" placeholder="My Workspace" value="${data.workspace_name || ''}" 
                  style="color: white !important; background-color: rgba(0, 0, 0, 0.4) !important; border-color: rgba(255, 255, 255, 0.1) !important;"
                  class="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all">
              </div>
              <div>
                <label class="block text-sm font-medium text-white mb-2">Workspace Type</label>
                <select id="workspace-type-select" 
                  class="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                  style="color: #ffffff !important; background-color: rgba(0, 0, 0, 0.6) !important; border-color: rgba(255, 255, 255, 0.15) !important; -webkit-appearance: none; -moz-appearance: none; appearance: none; background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E\"); background-repeat: no-repeat; background-position: right 12px center; background-size: 12px; padding-right: 40px; cursor: pointer;">
                  <option value="personal" ${data.workspace_type_select === 'personal' ? 'selected' : ''} style="background-color: #171717 !important; color: #ffffff !important; padding: 12px;">Personal</option>
                  <option value="company" ${data.workspace_type_select === 'company' ? 'selected' : ''} style="background-color: #171717 !important; color: #ffffff !important; padding: 12px;">Company</option>
                  <option value="nonprofit" ${data.workspace_type_select === 'nonprofit' ? 'selected' : ''} style="background-color: #171717 !important; color: #ffffff !important; padding: 12px;">Nonprofit</option>
                </select>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    },

    renderPresetStep(step, data) {
      return `
        <div class="space-y-6">
          <h3 class="text-lg font-bold text-brand-text-primary mb-4">Choose Your Platform Type</h3>
          <p class="text-brand-text-secondary mb-6">Select the preset that best matches your needs. You can customize this later.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="OnboardingWizard.selectPreset('inneranimal-media')" class="p-6 border-2 rounded-xl hover:border-brand-color-primary transition-all text-left ${data.preset === 'inneranimal-media' ? 'border-brand-color-primary bg-brand-color-primary-light' : 'border-brand-border-primary'}">
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold mb-3">IA</div>
              <h4 class="font-bold text-brand-text-primary mb-2">InnerAnimal Media</h4>
              <p class="text-sm text-brand-text-secondary mb-3">Media OS for creative teams</p>
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Projects</span>
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Media</span>
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Workflows</span>
              </div>
            </button>
            <button onclick="OnboardingWizard.selectPreset('meauxcloud')" class="p-6 border-2 rounded-xl hover:border-brand-color-primary transition-all text-left ${data.preset === 'meauxcloud' ? 'border-brand-color-primary bg-brand-color-primary-light' : 'border-brand-border-primary'}">
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold mb-3">MC</div>
              <h4 class="font-bold text-brand-text-primary mb-2">MeauxCloud</h4>
              <p class="text-sm text-brand-text-secondary mb-3">Cloud infrastructure platform</p>
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Deployments</span>
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Workers</span>
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">R2</span>
              </div>
            </button>
            <button onclick="OnboardingWizard.selectPreset('meauxbility')" class="p-6 border-2 rounded-xl hover:border-brand-color-primary transition-all text-left ${data.preset === 'meauxbility' ? 'border-brand-color-primary bg-brand-color-primary-light' : 'border-brand-border-primary'}">
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold mb-3">MB</div>
              <h4 class="font-bold text-brand-text-primary mb-2">Meauxbility</h4>
              <p class="text-sm text-brand-text-secondary mb-3">Foundation OS for nonprofits</p>
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Donations</span>
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Impact</span>
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Volunteers</span>
              </div>
            </button>
            <button onclick="OnboardingWizard.selectPreset('meauxos-core')" class="p-6 border-2 rounded-xl hover:border-brand-color-primary transition-all text-left ${data.preset === 'meauxos-core' ? 'border-brand-color-primary bg-brand-color-primary-light' : 'border-brand-border-primary'}">
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center text-white font-bold mb-3">MO</div>
              <h4 class="font-bold text-brand-text-primary mb-2">MeauxOS Core</h4>
              <p class="text-sm text-brand-text-secondary mb-3">Core platform administration</p>
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Tenants</span>
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Billing</span>
                <span class="px-2 py-1 bg-brand-bg-panel rounded text-xs text-brand-text-secondary">Audit</span>
              </div>
            </button>
          </div>
        </div>
      `;
    },

    renderModulesStep(step, data) {
      const modules = [
        { key: 'meauxwork', name: 'MeauxWork', description: 'Projects and tasks management', icon: 'briefcase' },
        { key: 'meauxmail', name: 'MeauxMail', description: 'Email sending and templates', icon: 'mail' },
        { key: 'meauxmcp', name: 'MeauxMCP', description: 'Agent manager and tools', icon: 'server' },
        { key: 'meauxcloud', name: 'MeauxCloud', description: 'R2/D1/KV/Pages management', icon: 'cloud' },
        { key: 'analytics', name: 'Analytics', description: 'Usage and performance tracking', icon: 'bar-chart' },
        { key: 'media', name: 'Media Library', description: 'R2 assets and storage', icon: 'image' },
        { key: 'billing', name: 'Billing', description: 'Payment and subscription management', icon: 'credit-card' }
      ];

      const selectedModules = data.modules || [];

      return `
        <div class="space-y-6">
          <h3 class="text-lg font-bold text-brand-text-primary mb-4">Enable Your Tools</h3>
          <p class="text-brand-text-secondary mb-6">Select which modules you want to use. You can change this anytime.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${modules.map(module => `
              <label class="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer hover:border-brand-color-primary transition-all ${selectedModules.includes(module.key) ? 'border-brand-color-primary bg-brand-color-primary-light' : 'border-brand-border-primary'}">
                <input type="checkbox" value="${module.key}" ${selectedModules.includes(module.key) ? 'checked' : ''} 
                  onchange="OnboardingWizard.toggleModule('${module.key}')"
                  class="mt-1 w-5 h-5 rounded border-brand-border-primary text-brand-color-primary focus:ring-brand-color-primary">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <i data-lucide="${module.icon}" class="w-5 h-5 text-brand-color-primary"></i>
                    <h4 class="font-bold text-brand-text-primary">${module.name}</h4>
                  </div>
                  <p class="text-sm text-brand-text-secondary">${module.description}</p>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    },

    renderBrandStep(step, data) {
      const themeMode = data.theme_mode || 'dark'; // Default to dark
      const isLight = themeMode === 'light';
      const isDark = themeMode === 'dark';
      const isSystem = themeMode === 'system';

      return `
        <div class="space-y-6">
          <h3 class="text-lg font-bold text-white mb-4">Brand & UI Setup</h3>
          <p class="text-zinc-400 mb-6">Customize your workspace branding (optional - you can skip this)</p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-white mb-2">Theme Mode</label>
              <div class="flex gap-4">
                <button onclick="OnboardingWizard.setThemeMode('light')" 
                  style="color: ${isLight ? '#ffffff' : '#a1a1aa'}; background-color: ${isLight ? 'rgba(255, 107, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'}; border-color: ${isLight ? '#ff6b00' : 'rgba(255, 255, 255, 0.1)'};"
                  class="flex-1 px-4 py-3 border-2 rounded-lg hover:border-orange-500 transition-all">
                  <i data-lucide="sun" class="w-6 h-6 mx-auto mb-2" style="color: ${isLight ? '#ff6b00' : '#a1a1aa'};"></i>
                  <span class="text-sm font-medium">Light</span>
                </button>
                <button onclick="OnboardingWizard.setThemeMode('dark')"
                  style="color: ${isDark ? '#ffffff' : '#a1a1aa'}; background-color: ${isDark ? 'rgba(255, 107, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'}; border-color: ${isDark ? '#ff6b00' : 'rgba(255, 255, 255, 0.1)'};"
                  class="flex-1 px-4 py-3 border-2 rounded-lg hover:border-orange-500 transition-all">
                  <i data-lucide="moon" class="w-6 h-6 mx-auto mb-2" style="color: ${isDark ? '#ff6b00' : '#a1a1aa'};"></i>
                  <span class="text-sm font-medium">Dark</span>
                </button>
                <button onclick="OnboardingWizard.setThemeMode('system')"
                  style="color: ${isSystem ? '#ffffff' : '#a1a1aa'}; background-color: ${isSystem ? 'rgba(255, 107, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'}; border-color: ${isSystem ? '#ff6b00' : 'rgba(255, 255, 255, 0.1)'};"
                  class="flex-1 px-4 py-3 border-2 rounded-lg hover:border-orange-500 transition-all">
                  <i data-lucide="monitor" class="w-6 h-6 mx-auto mb-2" style="color: ${isSystem ? '#ff6b00' : '#a1a1aa'};"></i>
                  <span class="text-sm font-medium">System</span>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-white mb-2">Upload Logo (Optional)</label>
              <div class="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer">
                <i data-lucide="upload" class="w-8 h-8 mx-auto mb-2 text-zinc-500"></i>
                <p class="text-sm text-zinc-400">Click to upload or drag and drop</p>
                <p class="text-xs text-zinc-500 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderDomainStep(step, data) {
      return `
        <div class="space-y-6">
          <h3 class="text-lg font-bold text-brand-text-primary mb-4">Domain & Environment</h3>
          <p class="text-brand-text-secondary mb-6">Set up your custom domain or use the default subdomain (optional)</p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-brand-text-primary mb-2">Subdomain</label>
              <div class="flex items-center gap-2">
                <input type="text" id="workspace-slug" placeholder="myworkspace" value="${data.workspace_slug || ''}" 
                  class="flex-1 px-4 py-2 bg-brand-bg-panel border border-brand-border-primary rounded-l-lg text-brand-text-primary placeholder-brand-text-tertiary focus:outline-none focus:border-brand-color-primary focus:ring-2 focus:ring-brand-color-primary/20">
                <span class="px-4 py-2 bg-brand-bg-panel border border-brand-border-primary border-l-0 rounded-r-lg text-brand-text-secondary">.meauxos.app</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-brand-text-primary mb-2">Custom Domain (Optional)</label>
              <input type="text" id="custom-domain" placeholder="myworkspace.com" value="${data.custom_domain || ''}" 
                class="w-full px-4 py-2 bg-brand-bg-panel border border-brand-border-primary rounded-lg text-brand-text-primary placeholder-brand-text-tertiary focus:outline-none focus:border-brand-color-primary focus:ring-2 focus:ring-brand-color-primary/20">
              <p class="text-xs text-brand-text-tertiary mt-1">You can connect a custom domain later in settings</p>
            </div>
          </div>
        </div>
      `;
    },

    renderTeamStep(step, data) {
      return `
        <div class="space-y-6">
          <h3 class="text-lg font-bold text-brand-text-primary mb-4">Invite Team Members</h3>
          <p class="text-brand-text-secondary mb-6">Add collaborators to your workspace (optional - you can invite them later)</p>
          <div class="space-y-4">
            <div class="border border-brand-border-primary rounded-lg p-4">
              <div class="flex items-center gap-3 mb-4">
                <input type="email" id="invite-email" placeholder="colleague@example.com" 
                  class="flex-1 px-4 py-2 bg-brand-bg-panel border border-brand-border-primary rounded-lg text-brand-text-primary placeholder-brand-text-tertiary focus:outline-none focus:border-brand-color-primary focus:ring-2 focus:ring-brand-color-primary/20">
                <select id="invite-role" class="px-4 py-2 bg-brand-bg-panel border border-brand-border-primary rounded-lg text-brand-text-primary focus:outline-none focus:border-brand-color-primary focus:ring-2 focus:ring-brand-color-primary/20">
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
                <button onclick="OnboardingWizard.addInvite()" class="px-4 py-2 bg-brand-color-primary text-white rounded-lg hover:bg-brand-color-primary-hover transition-colors">
                  <i data-lucide="plus" class="w-4 h-4"></i>
                </button>
              </div>
              <div id="invite-list" class="space-y-2">
                ${(data.invites || []).map(invite => `
                  <div class="flex items-center justify-between p-3 bg-brand-bg-panel rounded-lg">
                    <div>
                      <span class="text-sm font-medium text-brand-text-primary">${invite.email}</span>
                      <span class="text-xs text-brand-text-secondary ml-2">(${invite.role})</span>
                    </div>
                    <button onclick="OnboardingWizard.removeInvite('${invite.email}')" class="p-1 rounded hover:bg-brand-bg-surface transition-colors text-brand-text-tertiary">
                      <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderFinishStep(step, data) {
      return `
        <div class="space-y-6 text-center">
          <img src="https://imagedelivery.net/g7wf09fCONpnidkRnR_5vw/17535395-1501-490a-ff3d-e43d7c16a000/avatar" 
               alt="InnerAnimalMedia" 
               class="w-24 h-24 rounded-xl mx-auto mb-6 shadow-lg object-cover">
          <h3 class="text-2xl font-bold text-white mb-2">${this.t('welcomeMessage')}</h3>
          <p class="text-zinc-400 mb-8">${this.t('workspaceReady')}</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div class="p-4 bg-brand-surface rounded-lg border border-white/10">
              <i data-lucide="rocket" class="w-6 h-6 text-brand-orange mb-2"></i>
              <h4 class="font-bold text-white mb-1">${this.t('getStarted')}</h4>
              <p class="text-xs text-zinc-400">${this.t('createFirstProject')}</p>
            </div>
            <div class="p-4 bg-brand-surface rounded-lg border border-white/10">
              <i data-lucide="book-open" class="w-6 h-6 text-red-500 mb-2"></i>
              <h4 class="font-bold text-white mb-1">${this.t('learnMore')}</h4>
              <p class="text-xs text-zinc-400">${this.t('readDocumentation')}</p>
            </div>
            <div class="p-4 bg-brand-surface rounded-lg border border-white/10">
              <i data-lucide="users" class="w-6 h-6 text-blue-400 mb-2"></i>
              <h4 class="font-bold text-white mb-1">${this.t('inviteTeam')}</h4>
              <p class="text-xs text-zinc-400">${this.t('addCollaborators')}</p>
            </div>
          </div>
        </div>
      `;
    },

    async handleAuth(provider) {
      if (provider === 'github' || provider === 'google') {
        // Redirect to OAuth authorize endpoint
        window.location.href = `/api/oauth/${provider}/authorize`;
        return;
      }

      // Email/password flow (collect form data)
      const emailInput = document.getElementById('user-email');
      const nameInput = document.getElementById('user-name');
      const email = emailInput ? emailInput.value.trim() : '';
      const name = nameInput ? nameInput.value.trim() : '';

      if (provider === 'email') {
        if (!email) {
          alert('Please enter your email address');
          if (emailInput) emailInput.focus();
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert('Please enter a valid email address');
          if (emailInput) emailInput.focus();
          return;
        }

        // Save auth data
        this.wizardData.auth = {
          provider: provider,
          email: email,
          name: name || email.split('@')[0],
          timestamp: Date.now()
        };

        // Mark auth step as completed
        await this.completeStep('auth', this.wizardData.auth);

        // Move to next step
        this.nextStep();
      } else {
        console.warn('Unknown auth provider:', provider);
      }
    },

    selectWorkspaceType(type) {
      this.wizardData.create_tenant = this.wizardData.create_tenant || {};
      this.wizardData.create_tenant.workspace_type = type;
      // Preserve existing input values when re-rendering
      const workspaceNameInput = document.getElementById('workspace-name');
      const workspaceTypeSelect = document.getElementById('workspace-type-select');
      if (workspaceNameInput) {
        this.wizardData.create_tenant.workspace_name = workspaceNameInput.value;
      }
      if (workspaceTypeSelect) {
        this.wizardData.create_tenant.workspace_type_select = workspaceTypeSelect.value;
      }
      this.renderStep();
    },

    selectPreset(preset) {
      this.wizardData.choose_preset = this.wizardData.choose_preset || {};
      this.wizardData.choose_preset.preset = preset;
      this.renderStep();
    },

    toggleModule(moduleKey) {
      this.wizardData.choose_modules = this.wizardData.choose_modules || {};
      this.wizardData.choose_modules.modules = this.wizardData.choose_modules.modules || [];
      const index = this.wizardData.choose_modules.modules.indexOf(moduleKey);
      if (index > -1) {
        this.wizardData.choose_modules.modules.splice(index, 1);
      } else {
        this.wizardData.choose_modules.modules.push(moduleKey);
      }
      this.renderStep();
    },

    setThemeMode(mode) {
      // Ensure brand_setup exists
      this.wizardData.brand_setup = this.wizardData.brand_setup || {};
      // Update theme mode
      this.wizardData.brand_setup.theme_mode = mode;
      
      // Actually apply the theme to the document
      if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.classList.toggle('dark', mode === 'dark');
        document.documentElement.setAttribute('data-theme', mode);
      }
      
      // Save to localStorage for persistence
      localStorage.setItem('theme', mode);
      
      // Re-render immediately for instant visual feedback
      this.renderStep();
      
      // Save to state in background (don't wait)
      this.completeStep('brand_setup', this.wizardData.brand_setup).catch(err => {
        console.error('Error saving theme mode:', err);
      });
    },

    addInvite() {
      const emailInput = document.getElementById('invite-email');
      const roleSelect = document.getElementById('invite-role');
      if (!emailInput || !emailInput.value) return;

      this.wizardData.invite_team = this.wizardData.invite_team || {};
      this.wizardData.invite_team.invites = this.wizardData.invite_team.invites || [];
      this.wizardData.invite_team.invites.push({
        email: emailInput.value,
        role: roleSelect.value
      });
      emailInput.value = '';
      this.renderStep();
    },

    removeInvite(email) {
      if (this.wizardData.invite_team && this.wizardData.invite_team.invites) {
        this.wizardData.invite_team.invites = this.wizardData.invite_team.invites.filter(i => i.email !== email);
        this.renderStep();
      }
    },

    async previousStep() {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.renderStep();
      }
    },

    async nextStep() {
      const currentStepDef = this.steps[this.currentStep];
      if (!currentStepDef) return;

      // Validate and save current step data (including form inputs)
      if (currentStepDef.step_key === 'auth') {
        // Validate email on auth step
        const emailInput = document.getElementById('user-email');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email) {
          alert(this.t('emailRequired'));
          if (emailInput) emailInput.focus();
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert(this.t('emailInvalid'));
          if (emailInput) emailInput.focus();
          return;
        }

        // Save auth data
        const nameInput = document.getElementById('user-name');
        this.wizardData.auth = {
          email: email,
          name: nameInput ? nameInput.value.trim() : email.split('@')[0],
          provider: 'email'
        };
      } else if (currentStepDef.step_key === 'create_tenant') {
        const workspaceNameInput = document.getElementById('workspace-name');
        const workspaceTypeSelect = document.getElementById('workspace-type-select');
        if (workspaceNameInput) {
          this.wizardData.create_tenant = this.wizardData.create_tenant || {};
          this.wizardData.create_tenant.workspace_name = workspaceNameInput.value.trim();
        }
        if (workspaceTypeSelect) {
          this.wizardData.create_tenant = this.wizardData.create_tenant || {};
          this.wizardData.create_tenant.workspace_type_select = workspaceTypeSelect.value;
        }
      }

      // Save current step data
      await this.completeStep(currentStepDef.step_key, this.wizardData[currentStepDef.step_key] || {});

      // Check if this is the last step
      if (this.currentStep === this.steps.length - 1) {
        await this.finishOnboarding();
      } else {
        // Move to next step
        this.currentStep++;
        this.renderStep();
      }
    },

    async skipStep() {
      const currentStepDef = this.steps[this.currentStep];
      if (!currentStepDef) return;

      // Mark step as skipped
      await this.completeStep(currentStepDef.step_key, {}, 'skipped');

      // Move to next step
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
        this.renderStep();
      }
    },

    async completeStep(stepKey, meta = {}, status = 'completed') {
      try {
        const response = await fetch(`${window.location.origin}/api/onboarding/step/${stepKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: this.tenantId,
            status: status,
            meta_json: meta
          })
        });
        const data = await response.json();
        if (data.success) {
          this.wizardData[stepKey] = meta;
        }
      } catch (error) {
        console.error('Failed to save onboarding step:', error);
      }
    },

    async finishOnboarding() {
      try {
        // Collect all onboarding data
        const authData = this.wizardData.auth || {};
        const tenantData = this.wizardData.create_tenant || {};
        const presetData = this.wizardData.choose_preset || {};
        const modulesData = this.wizardData.choose_modules || {};

        // Ensure we have email (required)
        if (!authData.email) {
          alert(`${this.t('emailRequired')} Please go back and complete the auth step.`);
          // Navigate back to auth step
          const authStepIndex = this.steps.findIndex(s => s.step_key === 'auth');
          if (authStepIndex >= 0) {
            this.currentStep = authStepIndex;
            this.renderStep();
          }
          return;
        }

        // Mark onboarding as completed
        await this.completeStep('finish', { completed: true }, 'completed');

        // Create tenant and user via API
        try {
          const response = await fetch(`${window.location.origin}/api/tenants`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: authData.email,
              name: authData.name || authData.email.split('@')[0],
              workspace_name: tenantData.workspace_name || null,
              workspace_type: tenantData.workspace_type_select || 'personal',
              preset: presetData.preset || null,
              modules: modulesData.modules || []
            })
          });

          const result = await response.json();

          if (result.success && result.data) {
            // Save tenant ID for future requests
            localStorage.setItem('tenant_id', result.data.tenant.id);
            localStorage.setItem('user_id', result.data.user.id);
            localStorage.setItem('user_email', result.data.user.email);
            localStorage.setItem('onboarding_completed', 'true');

            console.log('Tenant and user created successfully:', result.data);

            // Hide modal and redirect to dashboard
            this.hide();
            setTimeout(() => {
              window.location.href = '/dashboard/';
            }, 500);
          } else {
            const errorMsg = result.error || result.message || 'Failed to create tenant and user';
            console.error('Tenant creation failed:', result);
            throw new Error(errorMsg);
          }
        } catch (apiError) {
          console.error('Error creating tenant/user:', apiError);
          console.error('API error details:', apiError);
          const errorMessage = apiError.message || 'Failed to complete signup';
          alert(`Failed to complete signup: ${errorMessage}. Please try again or contact support.`);
          // Still mark onboarding as completed locally even if API fails
          localStorage.setItem('onboarding_completed', 'true');
          this.hide();
        }
      } catch (error) {
        console.error('Failed to finish onboarding:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  // Export for global access
  window.OnboardingWizard = OnboardingWizard;

  // Auto-initialize if on dashboard
  if (window.location.pathname.includes('/dashboard')) {
    document.addEventListener('DOMContentLoaded', () => {
      // Check if onboarding should be shown
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      if (!onboardingCompleted || onboardingCompleted === 'false') {
        OnboardingWizard.init();
      }
    });
  }
})();
