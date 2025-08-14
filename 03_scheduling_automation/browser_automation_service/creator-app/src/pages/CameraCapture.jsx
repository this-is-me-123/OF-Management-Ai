import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { useDropzone } from 'react-dropzone';
import { 
  Camera, 
  Video, 
  Upload, 
  RotateCcw, 
  FlipHorizontal,
  FlashOn,
  FlashOff,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function CameraCapture() {
  const [mode, setMode] = useState('photo'); // 'photo', 'video', 'upload'
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const navigate = useNavigate();

  // Camera constraints
  const videoConstraints = {
    width: 720,
    height: 1280,
    facingMode: facingMode
  };

  // Capture photo
  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedMedia({
        type: 'image',
        data: imageSrc,
        timestamp: Date.now()
      });
      
      // Add camera flash effect
      const flashDiv = document.createElement('div');
      flashDiv.className = 'camera-flash fixed inset-0 z-50 pointer-events-none';
      document.body.appendChild(flashDiv);
      setTimeout(() => document.body.removeChild(flashDiv), 300);
      
      toast.success('Photo captured!');
    }
  }, [webcamRef]);

  // Start video recording
  const startRecording = useCallback(() => {
    if (webcamRef.current && webcamRef.current.stream) {
      const mediaRecorder = new MediaRecorder(webcamRef.current.stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(blob);
        setCapturedMedia({
          type: 'video',
          data: videoUrl,
          blob: blob,
          timestamp: Date.now()
        });
        toast.success('Video captured!');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    }
  }, [webcamRef]);

  // Stop video recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Handle file drop/upload
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      
      setCapturedMedia({
        type: fileType,
        data: fileUrl,
        file: file,
        timestamp: Date.now()
      });
      
      toast.success(`${fileType} uploaded!`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false
  });

  // Process with AI
  const processWithAI = async () => {
    if (!capturedMedia) return;
    
    setIsProcessing(true);
    try {
      // Simulate AI processing (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to content editor with captured media
      const mediaId = Date.now().toString();
      localStorage.setItem(`captured-media-${mediaId}`, JSON.stringify(capturedMedia));
      navigate(`/content/edit/${mediaId}`);
      
    } catch (error) {
      toast.error('Failed to process media');
      console.error('AI processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Switch camera facing mode
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Toggle flash (for environment camera)
  const toggleFlash = () => {
    setFlashEnabled(prev => !prev);
    // Note: Flash control would need additional implementation for actual devices
  };

  const ModeSelector = () => (
    <div className="flex items-center justify-center space-x-1 bg-black/20 rounded-full p-1 mb-4">
      {[
        { mode: 'photo', icon: Camera, label: 'Photo' },
        { mode: 'video', icon: Video, label: 'Video' },
        { mode: 'upload', icon: Upload, label: 'Upload' }
      ].map(({ mode: modeType, icon: Icon, label }) => (
        <button
          key={modeType}
          onClick={() => setMode(modeType)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === modeType 
              ? 'bg-white text-gray-900' 
              : 'text-white hover:bg-white/20'
          }`}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );

  const CameraControls = () => (
    <div className="camera-controls">
      <div className="flex items-center justify-between w-full max-w-sm mx-auto">
        {/* Flash Toggle */}
        <button
          onClick={toggleFlash}
          className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white"
        >
          {flashEnabled ? <FlashOn size={20} /> : <FlashOff size={20} />}
        </button>

        {/* Capture Button */}
        <button
          onClick={mode === 'photo' ? capturePhoto : isRecording ? stopRecording : startRecording}
          className={`capture-button ${isRecording ? 'recording' : ''}`}
        >
          {mode === 'photo' ? (
            <div className="w-6 h-6 bg-gray-800 rounded-full" />
          ) : isRecording ? (
            <div className="w-6 h-6 bg-white rounded-sm" />
          ) : (
            <div className="w-6 h-6 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Camera Switch */}
        <button
          onClick={switchCamera}
          className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {isRecording && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Recording</span>
          </div>
        </div>
      )}
    </div>
  );

  const CapturedMediaPreview = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button
          onClick={() => setCapturedMedia(null)}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
        >
          <X size={20} />
        </button>
        <h3 className="font-semibold">
          {capturedMedia?.type === 'image' ? 'Photo Preview' : 'Video Preview'}
        </h3>
        <div className="w-10" />
      </div>

      {/* Media Preview */}
      <div className="flex-1 flex items-center justify-center p-4">
        {capturedMedia?.type === 'image' ? (
          <img
            src={capturedMedia.data}
            alt="Captured"
            className="max-w-full max-h-full rounded-xl"
          />
        ) : (
          <video
            src={capturedMedia?.data}
            controls
            className="max-w-full max-h-full rounded-xl"
          />
        )}
      </div>

      {/* Actions */}
      <div className="p-6 space-y-3">
        <button
          onClick={processWithAI}
          disabled={isProcessing}
          className="creator-btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing with AI...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Enhance with AI</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
        
        <button
          onClick={() => setCapturedMedia(null)}
          className="creator-btn-secondary w-full"
        >
          Retake
        </button>
      </div>
    </motion.div>
  );

  // Show captured media preview
  if (capturedMedia) {
    return <CapturedMediaPreview />;
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <ModeSelector />

      {/* Camera/Upload Area */}
      {mode === 'upload' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="camera-container"
        >
          <div
            {...getRootProps()}
            className={`upload-zone h-full ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload size={48} className="text-primary-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragActive ? 'Drop your media here' : 'Upload Photo or Video'}
            </h3>
            <p className="text-gray-600 text-center max-w-sm">
              Drag and drop your content, or tap to browse. 
              Max size: 100MB
            </p>
            <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <ImageIcon size={16} />
                <span>Photos</span>
              </span>
              <span className="flex items-center space-x-1">
                <Video size={16} />
                <span>Videos</span>
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="camera-container"
        >
          <Webcam
            ref={webcamRef}
            audio={mode === 'video'}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover camera-viewfinder"
            mirrored={facingMode === 'user'}
          />
          
          <div className="camera-overlay" />
          <CameraControls />
        </motion.div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="creator-card p-4"
      >
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">AI Enhancement Tips</h4>
            <p className="text-sm text-gray-600">
              • Good lighting improves AI processing quality
              <br />
              • Keep subjects centered for better optimization
              <br />
              • Videos under 30 seconds process faster
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/content')}
          className="creator-btn-secondary text-center py-4"
        >
          <ImageIcon size={20} className="mx-auto mb-2" />
          <span className="text-sm">My Library</span>
        </button>
        
        <button
          onClick={() => navigate('/analytics')}
          className="creator-btn-secondary text-center py-4"
        >
          <BarChart3 size={20} className="mx-auto mb-2" />
          <span className="text-sm">Performance</span>
        </button>
      </div>
    </div>
  );
}