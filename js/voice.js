// ===============================================
// SYSTÈME DE CHAT VOCAL ET AUDIO
// ===============================================

// Variables audio globales
let audioContext;
let mediaStream;
let voiceAnalyser;
let voiceDataArray;

// Contrôles audio
function toggleMicrophone() {
    isMicrophoneEnabled = !isMicrophoneEnabled;
    const micButton = document.getElementById('micButton');
    
    if (isMicrophoneEnabled) {
        micButton.textContent = '🎤 Micro';
        micButton.classList.remove('active');
        showNotification('Microphone activé 🎤');
    } else {
        micButton.textContent = '🎤 Muet';
        micButton.classList.add('active');
        showNotification('Microphone désactivé 🔇');
        
        // Arrêter l'enregistrement si en cours
        if (isRecording) {
            stopVoiceRecording();
        }
    }
}

function toggleSpeaker() {
    isSpeakerEnabled = !isSpeakerEnabled;
    const speakerButton = document.getElementById('speakerButton');
    
    if (isSpeakerEnabled) {
        speakerButton.textContent = '🔊 Audio';
        speakerButton.classList.remove('active');
        showNotification('Audio activé 🔊');
    } else {
        speakerButton.textContent = '🔇 Muet';
        speakerButton.classList.add('active');
        showNotification('Audio désactivé 🔇');
    }
}

// Enregistrement vocal
async function startVoiceRecording() {
    if (!isMicrophoneEnabled) {
        showNotification('Microphone désactivé', 'warning');
        return;
    }
    
    if (isRecording) {
        stopVoiceRecording();
        return;
    }

    try {
        // Demander permission microphone
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        // Initialiser MediaRecorder
        mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType: 'audio/webm'
        });
        
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            processVoiceRecording();
        };
        
        // Démarrer l'enregistrement
        mediaRecorder.start();
        isRecording = true;
        
        // Interface visuelle
        updateVoiceRecordingUI(true);
        showNotification('🎙️ Enregistrement vocal en cours... Cliquez pour arrêter', 'info');
        
        // Initialiser la reconnaissance vocale si disponible
        initializeSpeechRecognition();
        
    } catch (error) {
        console.error('Erreur accès microphone:', error);
        showNotification('Impossible d\'accéder au microphone', 'error');
        isRecording = false;
    }
}

function stopVoiceRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    if (speechRecognition) {
        speechRecognition.stop();
    }
    
    updateVoiceRecordingUI(false);
    showNotification('🎙️ Enregistrement terminé', 'info');
}

function processVoiceRecording() {
    if (audioChunks.length === 0) {
        showNotification('Aucun audio enregistré', 'warning');
        return;
    }
    
    // Créer blob audio
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Ajouter le message vocal au chat
    addVoiceMessage(getCurrentUser(), audioUrl, true);
    
    // Simulation d'envoi (en vrai, on enverrait au serveur)
    setTimeout(() => {
        showNotification('Message vocal envoyé ! 🎵', 'success');
        
        // Simulation de réponse vocale
        if (Math.random() > 0.5) {
            simulateVoiceResponse();
        }
    }, 500);
}

function addVoiceMessage(user, audioUrl, isOwn = false) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `tonios-chat-message voice-message ${isOwn ? 'own' : ''}`;
    
    const time = new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageEl.innerHTML = `
        <div class="tonios-chat-message-header">
            <span class="tonios-chat-user">${user}</span>
            <span class="tonios-chat-time">${time}</span>
        </div>
        <div class="tonios-voice-message-content">
            <div class="tonios-voice-player">
                <button onclick="playVoiceMessage(this)" class="tonios-voice-play-btn">▶️</button>
                <audio src="${audioUrl}" preload="metadata"></audio>
                <div class="tonios-voice-waveform">🎵 Message vocal</div>
                <span class="tonios-voice-duration">--:--</span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Charger la durée
    const audio = messageEl.querySelector('audio');
    audio.onloadedmetadata = () => {
        const duration = Math.floor(audio.duration);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        messageEl.querySelector('.tonios-voice-duration').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
}

function playVoiceMessage(button) {
    if (!isSpeakerEnabled) {
        showNotification('Audio désactivé', 'warning');
        return;
    }
    
    const audio = button.parentElement.querySelector('audio');
    const isPlaying = !audio.paused;
    
    // Arrêter tous les autres audios
    document.querySelectorAll('.tonios-voice-message-content audio').forEach(a => {
        if (a !== audio) {
            a.pause();
            a.currentTime = 0;
        }
    });
    
    // Réinitialiser tous les boutons
    document.querySelectorAll('.tonios-voice-play-btn').forEach(btn => {
        btn.textContent = '▶️';
    });
    
    if (isPlaying) {
        audio.pause();
        button.textContent = '▶️';
    } else {
        audio.play();
        button.textContent = '⏸️';
        
        audio.onended = () => {
            button.textContent = '▶️';
        };
    }
}

function updateVoiceRecordingUI(recording) {
    const recordButton = document.querySelector('.tonios-voice-btn.record');
    if (recordButton) {
        if (recording) {
            recordButton.textContent = '⏹️ Arrêter';
            recordButton.classList.add('recording');
            
            // Animation de pulsation
            recordButton.style.animation = 'pulse 1s infinite';
        } else {
            recordButton.textContent = '🎙️ Parler';
            recordButton.classList.remove('recording');
            recordButton.style.animation = '';
        }
    }
}

// Reconnaissance vocale
function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Reconnaissance vocale non supportée');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognition();
    
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'fr-FR';
    
    speechRecognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (finalTranscript) {
            // Ajouter le texte transcrit au chat
            addTranscriptMessage(finalTranscript);
        }
        
        // Afficher le texte en cours dans l'input (optionnel)
        const chatInput = document.getElementById('chatInput');
        if (chatInput && interimTranscript) {
            chatInput.placeholder = `Reconnaissance: ${interimTranscript}...`;
        }
    };
    
    speechRecognition.onerror = (event) => {
        console.error('Erreur reconnaissance vocale:', event.error);
        if (event.error === 'no-speech') {
            showNotification('Aucune parole détectée', 'warning');
        }
    };
    
    speechRecognition.onend = () => {
        if (isRecording) {
            // Redémarrer si on est toujours en mode enregistrement
            try {
                speechRecognition.start();
            } catch (error) {
                console.log('Redémarrage reconnaissance vocale échoué');
            }
        }
    };
    
    try {
        speechRecognition.start();
    } catch (error) {
        console.error('Impossible de démarrer la reconnaissance vocale:', error);
    }
}

function addTranscriptMessage(transcript) {
    if (transcript.trim()) {
        // Ajouter un message de transcription
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            const messageEl = document.createElement('div');
            messageEl.className = 'tonios-chat-message transcript own';
            messageEl.innerHTML = `
                <div class="tonios-chat-message-header">
                    <span class="tonios-chat-user">${getCurrentUser()}</span>
                    <span class="tonios-chat-transcript-label">🎤 Transcription</span>
                    <span class="tonios-chat-time">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="tonios-chat-message-content">${transcript}</div>
            `;
            
            messagesContainer.appendChild(messageEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Sauvegarder le message transcrit
        if (currentSession) {
            const chatMessage = {
                id: Date.now() + Math.random(),
                user: getCurrentUser(),
                message: `🎤 ${transcript}`,
                timestamp: new Date().toISOString(),
                channel: currentChannel,
                isOwn: true,
                type: 'voice-transcript'
            };
            
            if (channels.text[currentChannel]) {
                channels.text[currentChannel].messages.push(chatMessage);
            }
            chatMessages.push(chatMessage);
            saveChannelsData();
            saveUserData();
        }
    }
}

// Synthèse vocale
function speakMessage(text) {
    if (!isSpeakerEnabled || !speechSynthesis) {
        return;
    }
    
    // Arrêter toute synthèse en cours
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.7;
    
    // Choisir une voix française si disponible
    const voices = speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
    if (frenchVoice) {
        utterance.voice = frenchVoice;
    }
    
    utterance.onstart = () => {
        showNotification('🔊 Lecture audio...', 'info', 1000);
    };
    
    utterance.onend = () => {
        console.log('Synthèse vocale terminée');
    };
    
    utterance.onerror = (event) => {
        console.error('Erreur synthèse vocale:', event.error);
    };
    
    speechSynthesis.speak(utterance);
}

// Simulation de réponse vocale
function simulateVoiceResponse() {
    const responses = [
        'Intéressant ce que vous dites !',
        'Je vous écoute avec attention.',
        'Pouvez-vous développer votre idée ?',
        'C\'est un point de vue très pertinent.',
        'Merci pour ce partage vocal.'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setTimeout(() => {
        addSystemMessage(`🎤 Assistant vocal : ${randomResponse}`);
        
        // Synthèse vocale de la réponse
        if (isSpeakerEnabled) {
            speakMessage(randomResponse);
        }
    }, 1000);
}

// Initialisation de l'audio
async function initializeAudio() {
    try {
        // Initialiser le contexte audio
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        showNotification('🎵 Système audio initialisé', 'success', 1000);
        
        // Charger les voix pour la synthèse
        if (speechSynthesis) {
            speechSynthesis.onvoiceschanged = () => {
                console.log('Voix de synthèse chargées:', speechSynthesis.getVoices().length);
            };
        }
        
    } catch (error) {
        console.error('Erreur initialisation audio:', error);
        showNotification('Problème d\'initialisation audio', 'warning');
    }
}

// Analyseur de voix en temps réel
function setupVoiceAnalyzer() {
    if (!audioContext || !mediaStream) return;
    
    try {
        const source = audioContext.createMediaStreamSource(mediaStream);
        voiceAnalyser = audioContext.createAnalyser();
        voiceAnalyser.fftSize = 256;
        
        source.connect(voiceAnalyser);
        
        const bufferLength = voiceAnalyser.frequencyBinCount;
        voiceDataArray = new Uint8Array(bufferLength);
        
        // Visualisation en temps réel (optionnel)
        visualizeVoice();
        
    } catch (error) {
        console.error('Erreur analyseur vocal:', error);
    }
}

function visualizeVoice() {
    if (!voiceAnalyser || !voiceDataArray) return;
    
    const animate = () => {
        if (!isRecording) return;
        
        voiceAnalyser.getByteFrequencyData(voiceDataArray);
        
        // Calculer le niveau moyen
        let sum = 0;
        for (let i = 0; i < voiceDataArray.length; i++) {
            sum += voiceDataArray[i];
        }
        const average = sum / voiceDataArray.length;
        
        // Mettre à jour l'interface selon le niveau
        const recordButton = document.querySelector('.tonios-voice-btn.record');
        if (recordButton && average > 30) {
            recordButton.style.boxShadow = `0 0 ${average / 5}px rgba(52, 152, 219, 0.8)`;
        }
        
        requestAnimationFrame(animate);
    };
    
    animate();
}

// Raccourcis clavier pour le vocal
function setupVoiceShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Maintenir Espace pour parler (Push-to-talk)
        if (e.code === 'Space' && e.ctrlKey && !isRecording) {
            e.preventDefault();
            startVoiceRecording();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        // Relâcher Espace pour arrêter
        if (e.code === 'Space' && e.ctrlKey && isRecording) {
            e.preventDefault();
            stopVoiceRecording();
        }
    });
}

// Auto-détection de la parole
function setupVoiceActivation() {
    // Fonction pour détecter automatiquement quand l'utilisateur parle
    // et démarrer l'enregistrement (Voice Activation Detection)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                
                source.connect(analyser);
                analyser.fftSize = 512;
                
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                let silenceCount = 0;
                const silenceThreshold = 30; // Niveau de silence
                const maxSilenceFrames = 30; // Frames de silence avant d'arrêter
                
                const checkAudioLevel = () => {
                    analyser.getByteFrequencyData(dataArray);
                    
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;
                    
                    if (average > silenceThreshold) {
                        silenceCount = 0;
                        if (!isRecording && currentVoiceChannel) {
                            // Auto-démarrer l'enregistrement
                            startVoiceRecording();
                        }
                    } else {
                        silenceCount++;
                        if (silenceCount > maxSilenceFrames && isRecording) {
                            // Auto-arrêter après silence prolongé
                            stopVoiceRecording();
                        }
                    }
                    
                    if (currentVoiceChannel) {
                        requestAnimationFrame(checkAudioLevel);
                    }
                };
                
                // Démarrer la détection seulement si dans un canal vocal
                if (currentVoiceChannel) {
                    checkAudioLevel();
                }
            })
            .catch(error => {
                console.log('Auto-détection vocale non disponible:', error);
            });
    }
}
