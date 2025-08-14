/**
 * OFEM Mobile Content Creator Screen
 * Create content with camera integration and AI generation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { request, PERMISSIONS } from 'react-native-permissions';
import { showMessage } from 'react-native-flash-message';
import Modal from 'react-native-modal';

// Services
import { APIService } from '../services/APIService';

// Components
import { LoadingOverlay } from '../components/LoadingOverlay';

const { width, height } = Dimensions.get('window');

interface ContentCreatorScreenProps {
  navigation: any;
}

interface ContentOptions {
  content_type: string;
  style: string;
  mood: string;
  include_image: boolean;
  include_caption: boolean;
  custom_prompt?: string;
}

const ContentCreatorScreen: React.FC<ContentCreatorScreenProps> = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [contentOptions, setContentOptions] = useState<ContentOptions>({
    content_type: 'photo',
    style: 'professional',
    mood: 'confident',
    include_image: true,
    include_caption: true,
  });

  const contentTypes = [
    { label: 'Photo', value: 'photo', icon: 'photo-camera' },
    { label: 'Video', value: 'video', icon: 'videocam' },
    { label: 'Selfie', value: 'selfie', icon: 'camera-front' },
    { label: 'Behind Scenes', value: 'behind_scenes', icon: 'photo-library' },
  ];

  const styles = [
    { label: 'Professional', value: 'professional', color: '#2196F3' },
    { label: 'Artistic', value: 'artistic', color: '#9C27B0' },
    { label: 'Glamorous', value: 'glamorous', color: '#FF9800' },
    { label: 'Casual', value: 'casual', color: '#4CAF50' },
    { label: 'Intimate', value: 'intimate', color: '#F44336' },
  ];

  const moods = [
    { label: 'Confident', value: 'confident', emoji: '💪' },
    { label: 'Playful', value: 'playful', emoji: '😘' },
    { label: 'Elegant', value: 'elegant', emoji: '✨' },
    { label: 'Cozy', value: 'cozy', emoji: '🥰' },
    { label: 'Glamorous', value: 'glamorous', emoji: '💎' },
  ];

  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await request(permission);
      return result === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to add an image',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'AI Generate', onPress: generateAIImage },
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Needed', 'Camera permission is required to take photos');
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      handleImageResponse
    );
  };

  const openGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      handleImageResponse
    );
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      setSelectedImage(asset.uri || '');
      
      showMessage({
        message: 'Image selected',
        description: 'Ready to generate caption or create content',
        type: 'success',
      });
    }
  };

  const generateAIImage = async () => {
    if (!customPrompt.trim()) {
      Alert.alert('Custom Prompt Required', 'Please enter a description for the AI to generate an image');
      return;
    }

    try {
      setIsGenerating(true);
      
      const result = await APIService.generateContentPackage({
        ...contentOptions,
        custom_prompt: customPrompt,
        include_image: true,
        include_caption: false,
      });

      if (result.image?.success) {
        setSelectedImage(result.image.filepath);
        showMessage({
          message: 'AI Image Generated!',
          description: 'Your custom image has been created',
          type: 'success',
        });
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (error: any) {
      showMessage({
        message: 'Generation Failed',
        description: error.message,
        type: 'danger',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCaption = async () => {
    try {
      setIsGenerating(true);
      
      const result = await APIService.generateCaption({
        content_type: contentOptions.content_type,
        mood: contentOptions.mood,
        target_audience: 'subscribers',
      });

      if (result.success) {
        setGeneratedCaption(result.caption);
        showMessage({
          message: 'Caption Generated!',
          description: 'AI has created a perfect caption for your content',
          type: 'success',
        });
      } else {
        throw new Error('Failed to generate caption');
      }
    } catch (error: any) {
      showMessage({
        message: 'Caption Generation Failed',
        description: error.message,
        type: 'danger',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createContentPackage = async () => {
    try {
      setIsGenerating(true);
      
      const result = await APIService.generateContentPackage({
        ...contentOptions,
        custom_prompt: customPrompt || undefined,
      });

      if (result.package_id) {
        showMessage({
          message: 'Content Package Created!',
          description: 'Your content is ready for scheduling',
          type: 'success',
        });

        // Navigate to scheduler with the package
        navigation.navigate('Scheduler', { 
          contentPackage: result,
          prefilledCaption: result.caption?.caption || generatedCaption 
        });
      } else {
        throw new Error('Failed to create content package');
      }
    } catch (error: any) {
      showMessage({
        message: 'Content Creation Failed',
        description: error.message,
        type: 'danger',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const scheduleNow = async () => {
    if (!selectedImage && !generatedCaption) {
      Alert.alert('Content Required', 'Please add an image or generate a caption first');
      return;
    }

    const scheduleTime = new Date();
    scheduleTime.setHours(scheduleTime.getHours() + 1); // Schedule 1 hour from now

    try {
      setIsGenerating(true);
      
      const result = await APIService.schedulePost({
        content: selectedImage || 'Generated content',
        caption: generatedCaption || 'Check out my latest content! 💋',
        hashtags: '#onlyfans #exclusive #content',
        publishTime: scheduleTime.toISOString(),
      });

      showMessage({
        message: 'Content Scheduled!',
        description: `Will be posted at ${scheduleTime.toLocaleTimeString()}`,
        type: 'success',
      });

      navigation.goBack();
    } catch (error: any) {
      showMessage({
        message: 'Scheduling Failed',
        description: error.message,
        type: 'danger',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={screenStyles.container}>
      <ScrollView style={screenStyles.scrollView}>
        {/* Image Section */}
        <View style={screenStyles.imageSection}>
          {selectedImage ? (
            <View style={screenStyles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={screenStyles.selectedImage} />
              <TouchableOpacity
                style={screenStyles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={screenStyles.imagePlaceholder}
              onPress={handleImagePicker}
            >
              <Icon name="add-photo-alternate" size={64} color="#ccc" />
              <Text style={screenStyles.placeholderText}>Add Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Prompt Section */}
        <View style={screenStyles.promptSection}>
          <Text style={screenStyles.sectionTitle}>Custom Prompt (Optional)</Text>
          <TextInput
            style={screenStyles.promptInput}
            placeholder="Describe the image you want AI to generate..."
            value={customPrompt}
            onChangeText={setCustomPrompt}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Content Options */}
        <View style={screenStyles.optionsSection}>
          <TouchableOpacity
            style={screenStyles.optionsToggle}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Text style={screenStyles.sectionTitle}>Content Options</Text>
            <Icon 
              name={showOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
              size={24} 
              color="#333" 
            />
          </TouchableOpacity>

          {showOptions && (
            <View style={screenStyles.optionsContent}>
              {/* Content Type */}
              <Text style={screenStyles.optionLabel}>Content Type</Text>
              <View style={screenStyles.optionGrid}>
                {contentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      screenStyles.optionButton,
                      contentOptions.content_type === type.value && screenStyles.optionButtonActive
                    ]}
                    onPress={() => setContentOptions({...contentOptions, content_type: type.value})}
                  >
                    <Icon name={type.icon} size={20} color={contentOptions.content_type === type.value ? '#fff' : '#666'} />
                    <Text style={[
                      screenStyles.optionButtonText,
                      contentOptions.content_type === type.value && screenStyles.optionButtonTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Style */}
              <Text style={screenStyles.optionLabel}>Style</Text>
              <View style={screenStyles.optionGrid}>
                {styles.map((style) => (
                  <TouchableOpacity
                    key={style.value}
                    style={[
                      screenStyles.styleButton,
                      { borderColor: style.color },
                      contentOptions.style === style.value && { backgroundColor: style.color }
                    ]}
                    onPress={() => setContentOptions({...contentOptions, style: style.value})}
                  >
                    <Text style={[
                      screenStyles.styleButtonText,
                      contentOptions.style === style.value && { color: '#fff' }
                    ]}>
                      {style.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Mood */}
              <Text style={screenStyles.optionLabel}>Mood</Text>
              <View style={screenStyles.optionGrid}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      screenStyles.moodButton,
                      contentOptions.mood === mood.value && screenStyles.moodButtonActive
                    ]}
                    onPress={() => setContentOptions({...contentOptions, mood: mood.value})}
                  >
                    <Text style={screenStyles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={[
                      screenStyles.moodButtonText,
                      contentOptions.mood === mood.value && screenStyles.moodButtonTextActive
                    ]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Generated Caption */}
        {generatedCaption && (
          <View style={screenStyles.captionSection}>
            <Text style={screenStyles.sectionTitle}>Generated Caption</Text>
            <View style={screenStyles.captionContainer}>
              <Text style={screenStyles.captionText}>{generatedCaption}</Text>
              <TouchableOpacity
                style={screenStyles.editCaptionButton}
                onPress={() => {
                  Alert.prompt(
                    'Edit Caption',
                    'Customize your caption:',
                    (text) => setGeneratedCaption(text || generatedCaption),
                    'plain-text',
                    generatedCaption
                  );
                }}
              >
                <Icon name="edit" size={20} color="#FF1493" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={screenStyles.actionButtons}>
        <TouchableOpacity
          style={[screenStyles.actionButton, screenStyles.generateButton]}
          onPress={generateCaption}
          disabled={isGenerating}
        >
          <Icon name="auto-awesome" size={20} color="#fff" />
          <Text style={screenStyles.actionButtonText}>Generate Caption</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[screenStyles.actionButton, screenStyles.packageButton]}
          onPress={createContentPackage}
          disabled={isGenerating}
        >
          <Icon name="inventory" size={20} color="#fff" />
          <Text style={screenStyles.actionButtonText}>Create Package</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[screenStyles.actionButton, screenStyles.scheduleButton]}
          onPress={scheduleNow}
          disabled={isGenerating}
        >
          <Icon name="schedule" size={20} color="#fff" />
          <Text style={screenStyles.actionButtonText}>Schedule Now</Text>
        </TouchableOpacity>
      </View>

      {isGenerating && <LoadingOverlay message="Creating your content..." />}
    </View>
  );
};

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    padding: 20,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: width - 40,
    height: 250,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: width - 40,
    height: 250,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ccc',
  },
  promptSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  promptInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlignVertical: 'top',
  },
  optionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  optionsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  optionsContent: {
    marginTop: 10,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#FF1493',
    borderColor: '#FF1493',
  },
  optionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  styleButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 2,
    marginRight: 8,
    marginBottom: 8,
  },
  styleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  moodButtonActive: {
    backgroundColor: '#FF1493',
    borderColor: '#FF1493',
  },
  moodEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  moodButtonText: {
    fontSize: 12,
    color: '#666',
  },
  moodButtonTextActive: {
    color: '#fff',
  },
  captionSection: {
    padding: 20,
    paddingTop: 0,
  },
  captionContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  captionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  editCaptionButton: {
    marginLeft: 10,
    padding: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
  },
  packageButton: {
    backgroundColor: '#2196F3',
  },
  scheduleButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ContentCreatorScreen;