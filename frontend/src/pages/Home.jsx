import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Brain, Shield, Clock, Users } from 'lucide-react'
import ImageUpload from '../components/ImageUpload'
import axios from 'axios'
import toast from 'react-hot-toast'

const Home = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { getToken, isSignedIn } = useAuth()
  const navigate = useNavigate()

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first')
      return
    }
    
    if (!isSignedIn) {
      toast.error('Please sign in to analyze images')
      return
    }

    setIsAnalyzing(true)
    const formData = new FormData()
    formData.append('image', selectedImage)

    try {
      const token = await getToken()
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/diagnosis/analyze`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      )

      toast.success('Analysis complete!')
      navigate(`/consultation/${response.data._id}`)
    } catch (error) {
      console.error('Error analyzing image:', error)
      console.error('Response:', error.response?.data)
      toast.error('Failed to analyze image. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Diagnosis',
      description: 'Advanced machine learning models trained on thousands of dermatological cases'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your medical data is encrypted and stored securely with full privacy protection'
    },
    {
      icon: Clock,
      title: 'Instant Results',
      description: 'Get preliminary diagnosis results in seconds, not days'
    },
    {
      icon: Users,
      title: 'Expert Consultation',
      description: 'Chat with AI dermatologist for detailed advice and treatment recommendations'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          AI-Powered <span className="text-primary-600">Dermatology</span> Consultation
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Upload your skin image and get instant AI diagnosis for 8 common skin conditions. 
          Consult with our AI dermatologist for personalized advice.
        </p>
      </div>

      {/* Upload Section */}
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">Upload Your Image</h2>
          <ImageUpload 
            onImageSelect={setSelectedImage} 
            isLoading={isAnalyzing}
          />
          
          {selectedImage && (
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing || !isSignedIn}
              className="btn-primary w-full mt-6"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
            </button>
          )}
          
          {!isSignedIn && (
            <p className="text-center text-gray-600 mt-6">
              Please sign in to analyze your image
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">Detectable Conditions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Cellulitis', 'Impetigo', 'Athlete\'s Foot', 'Nail Fungus',
              'Ringworm', 'Cutaneous Larva Migrans', 'Chickenpox', 'Shingles'
            ].map((condition) => (
              <div key={condition} className="bg-gray-50 p-3 rounded-lg text-center">
                <span className="text-sm font-medium text-gray-700">{condition}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Medical Disclaimer:</strong> This tool is for informational purposes only. 
              Always consult with a qualified healthcare provider for proper diagnosis and treatment.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose DermaLLaMa-GPT?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home