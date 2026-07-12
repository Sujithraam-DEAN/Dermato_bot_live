import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, Calendar, Target, TrendingUp } from 'lucide-react'
import ChatBot from '../components/ChatBot'
import axios from 'axios'
import toast from 'react-hot-toast'

const Consultation = () => {
  const { diagnosisId } = useParams()
  const [diagnosis, setDiagnosis] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { getToken } = useAuth()

  useEffect(() => {
    loadDiagnosis()
  }, [diagnosisId])

  const loadDiagnosis = async () => {
    try {
      const token = await getToken()
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/diagnosis/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const foundDiagnosis = response.data.find(d => d._id === diagnosisId)
      if (foundDiagnosis) {
        setDiagnosis(foundDiagnosis)
      } else {
        toast.error('Diagnosis not found')
      }
    } catch (error) {
      console.error('Error loading diagnosis:', error)
      toast.error('Failed to load diagnosis')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConditionInfo = (condition) => {
    const info = {
      'Cellulitis': {
        description: 'A bacterial skin infection that affects the deeper layers of skin and underlying tissue.',
        symptoms: ['Redness', 'Swelling', 'Warmth', 'Pain', 'Fever'],
        urgency: 'Seek medical attention promptly'
      },
      'Impetigo': {
        description: 'A superficial bacterial skin infection that is highly contagious.',
        symptoms: ['Red sores', 'Honey-crusted lesions', 'Itching', 'Blisters'],
        urgency: 'Consult healthcare provider'
      },
      'Athlete\'s Foot': {
        description: 'A fungal infection that affects the feet, particularly between the toes.',
        symptoms: ['Itching', 'Burning', 'Peeling skin', 'Cracking'],
        urgency: 'Over-the-counter treatments available'
      },
      'Nail Fungus': {
        description: 'A fungal infection that affects the nails, causing discoloration and thickening.',
        symptoms: ['Yellow/brown nails', 'Thickened nails', 'Brittle nails', 'Odor'],
        urgency: 'Consult healthcare provider for treatment options'
      },
      'Ringworm': {
        description: 'A fungal infection that causes a ring-shaped rash on the skin.',
        symptoms: ['Circular rash', 'Red borders', 'Clear center', 'Itching'],
        urgency: 'Treatable with antifungal medications'
      },
      'Cutaneous Larva Migrans': {
        description: 'A parasitic skin infection caused by hookworm larvae.',
        symptoms: ['Serpentine tracks', 'Intense itching', 'Red raised lines'],
        urgency: 'Seek medical treatment'
      },
      'Chickenpox': {
        description: 'A viral infection causing an itchy rash with small, fluid-filled blisters.',
        symptoms: ['Itchy blisters', 'Fever', 'Fatigue', 'Loss of appetite'],
        urgency: 'Usually self-limiting, monitor for complications'
      },
      'Shingles': {
        description: 'A viral infection that causes a painful rash, usually on one side of the body.',
        symptoms: ['Painful rash', 'Burning sensation', 'Blisters', 'Fever'],
        urgency: 'Seek medical attention within 72 hours'
      }
    }
    return info[condition] || { description: 'No additional information available', symptoms: [], urgency: 'Consult healthcare provider' }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!diagnosis) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Diagnosis Not Found</h2>
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const conditionInfo = getConditionInfo(diagnosis.prediction)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link to="/dashboard" className="mr-4">
          <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-primary-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consultation Details</h1>
          <p className="text-gray-600">AI diagnosis and consultation chat</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Diagnosis Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Diagnosis Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Diagnosis Result</h2>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{formatDate(diagnosis.timestamp)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{diagnosis.prediction}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(diagnosis.confidence)}`}>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>{(diagnosis.confidence * 100).toFixed(1)}% confidence</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700">{conditionInfo.description}</p>
            </div>

            {/* Symptoms */}
            {conditionInfo.symptoms.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Common Symptoms:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {conditionInfo.symptoms.map((symptom, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-sm text-gray-700">{symptom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Advice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Recommended Action:</h4>
                  <p className="text-sm text-yellow-700">{conditionInfo.urgency}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="card bg-red-50 border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">Important Medical Disclaimer</h3>
            <p className="text-sm text-red-700">
              This AI diagnosis is for informational purposes only and should not replace professional medical advice. 
              Always consult with a qualified healthcare provider for proper diagnosis, treatment, and medical decisions. 
              If you have a medical emergency, seek immediate medical attention.
            </p>
          </div>
        </div>

        {/* Chat Section */}
        <div>
          <ChatBot 
            diagnosisId={diagnosisId} 
            diagnosis={diagnosis.prediction}
          />
        </div>
      </div>
    </div>
  )
}

export default Consultation