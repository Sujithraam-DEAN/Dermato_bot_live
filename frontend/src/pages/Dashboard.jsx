import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Calendar, MessageCircle, TrendingUp } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [diagnoses, setDiagnoses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { getToken } = useAuth()

  useEffect(() => {
    loadDiagnoses()
  }, [])

  const loadDiagnoses = async () => {
    try {
      const token = await getToken()
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/diagnosis/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setDiagnoses(response.data)
    } catch (error) {
      console.error('Error loading diagnoses:', error)
      toast.error('Failed to load diagnosis history')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getConditionStats = () => {
    const stats = {}
    diagnoses.forEach(diagnosis => {
      stats[diagnosis.prediction] = (stats[diagnosis.prediction] || 0) + 1
    })
    return Object.entries(stats).sort((a, b) => b[1] - a[1])
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Track your diagnosis history and health insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Diagnoses</p>
              <p className="text-2xl font-bold text-gray-900">{diagnoses.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {diagnoses.filter(d => 
                  new Date(d.timestamp).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultations</p>
              <p className="text-2xl font-bold text-gray-900">{diagnoses.length}</p>
            </div>
            <MessageCircle className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Diagnoses */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Recent Diagnoses</h2>
            
            {diagnoses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No diagnoses yet</p>
                <Link to="/" className="btn-primary">
                  Start Your First Analysis
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {diagnoses.slice(0, 5).map((diagnosis) => (
                  <div key={diagnosis._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{diagnosis.prediction}</h3>
                      <p className="text-sm text-gray-600">
                        Confidence: {(diagnosis.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(diagnosis.timestamp)}</p>
                    </div>
                    <Link
                      to={`/consultation/${diagnosis._id}`}
                      className="btn-secondary text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
                
                {diagnoses.length > 5 && (
                  <p className="text-center text-gray-500 text-sm">
                    And {diagnoses.length - 5} more diagnoses...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Condition Statistics */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Condition Overview</h2>
          
          {diagnoses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {getConditionStats().slice(0, 5).map(([condition, count]) => (
                <div key={condition} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{condition}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(count / diagnoses.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard