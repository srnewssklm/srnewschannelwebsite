import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Upload, Download, Search, X, Check, AlertTriangle, 
  Users, CheckCircle, XCircle, MessageCircle, Eye, 
  ChevronLeft, ChevronRight, Plus, Trash2,
  FileText, AlertCircle, Send, Loader, TestTube, Rocket
} from "lucide-react"
import toast from "react-hot-toast"
import { 
  sendWhatsAppCampaign, 
  loadCampaignHistory, 
  subscribeToCampaignUpdates 
} from '../../services/whatsappService'

// Phone number validation (international format)
const validatePhoneNumber = (phone) => {
  if (!phone) return false
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.toString().replace(/[\s\-()]/g, '')
  // Check if it's a valid international format (country code + number, 10-15 digits)
  return /^[1-9]\d{9,14}$/.test(cleaned)
}

// Validate recipient object
const validateRecipient = (recipient, allRecipients, index) => {
  const errors = []
  
  if (!recipient.name || recipient.name.trim() === '') {
    errors.push('Missing name')
  }
  
  if (!recipient.phone) {
    errors.push('Missing phone number')
  } else if (!validatePhoneNumber(recipient.phone)) {
    errors.push('Invalid phone format')
  }
  
  // Check for duplicates
  const phone = recipient.phone?.toString().replace(/[\s\-()]/g, '')
  const duplicateIndex = allRecipients.findIndex((r, i) => 
    i !== index && r.phone?.toString().replace(/[\s\-()]/g, '') === phone
  )
  if (duplicateIndex !== -1) {
    errors.push('Duplicate phone number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Statistics Card Component
function StatCard({ icon: Icon, label, value, color = "blue" }) {
  const bgColors = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    red: "bg-red-50",
    purple: "bg-purple-50"
  }
  const textColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600"
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${bgColors[color]}`}>
          <Icon size={20} className={textColors[color]} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </motion.div>
  )
}

// Review Modal Component
function ReviewModal({ isOpen, onClose, campaign, recipients, mode, onConfirm, isSending }) {
  if (!isOpen) return null

  const validRecipients = recipients.filter(r => r.selected && r.validation.isValid)
  const excludedCount = recipients.filter(r => !r.selected || !r.validation.isValid).length

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={!isSending ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Review Campaign</h3>
              {!isSending && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Mode Badge */}
              <div className="flex items-center gap-2">
                {mode === 'test' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                    <TestTube size={14} />
                    Test Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                    <Rocket size={14} />
                    Production Mode
                  </span>
                )}
              </div>

              {/* Campaign Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Campaign Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Campaign Name:</span>
                    <span className="text-sm font-medium text-gray-900">{campaign.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Selected Recipients:</span>
                    <span className="text-sm font-medium text-green-600">{validRecipients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Excluded Recipients:</span>
                    <span className="text-sm font-medium text-red-600">{excludedCount}</span>
                  </div>
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Message Preview</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{campaign.message.length} characters</p>
                </div>
              </div>

              {/* Sample Preview */}
              {validRecipients.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Sample Personalized Message</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs text-green-600 mb-2">To: {validRecipients[0].name} ({validRecipients[0].phone})</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {campaign.message.replace(/\{\{name\}\}/g, validRecipients[0].name)}
                    </p>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {campaign.message.includes('{{') && campaign.message.includes('}}') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Placeholder Variables Detected</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Make sure all recipients have the required fields for placeholder replacement.
                    </p>
                  </div>
                </div>
              )}

              {/* Mode Warning */}
              {mode === 'test' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Test Mode Active</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Messages will be sent using test configuration. Switch to Production mode to send to real customers.
                    </p>
                  </div>
                </div>
              )}

              {mode === 'production' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Production Mode - Real Messages</p>
                    <p className="text-xs text-orange-700 mt-1">
                      This will send actual WhatsApp messages to {validRecipients.length} recipient{validRecipients.length !== 1 ? 's' : ''}. Make sure you have proper consent.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Campaign
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AdminWhatsApp() {
  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Recipients state
  const [recipients, setRecipients] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const recipientsPerPage = 10

  // Campaign state
  const [campaignName, setCampaignName] = useState("")
  const [message, setMessage] = useState("")
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState(0)
  const [mode, setMode] = useState('test') // 'test' or 'production'

  // Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendResults, setSendResults] = useState(null)

  // Campaign history (loaded from database + demo data)
  const [campaignHistory, setCampaignHistory] = useState([])
  const [historySearch, setHistorySearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [historyLoading, setHistoryLoading] = useState(false)

  // Load campaign history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const campaigns = await loadCampaignHistory()
      
      // Add demo campaigns if no real campaigns exist
      const demoCampaigns = campaigns.length === 0 ? [
        {
          id: 'demo-1',
          name: "New Year Promotion",
          created_at: "2026-01-05T00:00:00Z",
          total_recipients: 150,
          sent_count: 150,
          status: "completed",
          mode: "test",
          type: "demo"
        },
        {
          id: 'demo-2',
          name: "Product Launch Alert",
          created_at: "2026-02-10T00:00:00Z",
          total_recipients: 230,
          sent_count: 230,
          status: "completed",
          mode: "production",
          type: "demo"
        }
      ] : []
      
      setCampaignHistory([...campaigns, ...demoCampaigns])
    } catch (error) {
      console.error('Error loading history:', error)
      toast.error('Failed to load campaign history')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Download sample JSON
  const downloadSampleJSON = () => {
    const sample = [
      { name: "Ravi Kumar", phone: "919876543210" },
      { name: "Priya Sharma", phone: "919876543211" },
      { name: "Amit Patel", phone: "919876543212" },
      { name: "Sneha Reddy", phone: "919876543213" }
    ]
    
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-recipients.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Sample JSON downloaded')
  }

  // Handle file upload
  const handleFileSelect = (file) => {
    if (!file) return
    
    if (file.type !== 'application/json') {
      toast.error('Please upload a valid JSON file')
      return
    }

    setIsProcessing(true)
    setUploadedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        if (!Array.isArray(data)) {
          throw new Error('JSON must be an array of recipients')
        }

        // Process and validate recipients
        const processedRecipients = data.map((item, index) => {
          const validation = validateRecipient(item, data, index)
          return {
            id: Date.now() + index,
            name: item.name || '',
            phone: item.phone || '',
            selected: validation.isValid,
            validation
          }
        })

        setRecipients(processedRecipients)
        setCurrentPage(1)
        toast.success(`Loaded ${processedRecipients.length} recipients`)
      } catch (error) {
        toast.error(`Error parsing JSON: ${error.message}`)
        setUploadedFile(null)
      } finally {
        setIsProcessing(false)
      }
    }
    
    reader.onerror = () => {
      toast.error('Error reading file')
      setIsProcessing(false)
      setUploadedFile(null)
    }
    
    reader.readAsText(file)
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null)
    setRecipients([])
    setSearchQuery("")
    setCurrentPage(1)
    setCampaignName("")
    setMessage("")
  }

  // Select/deselect recipients
  const toggleRecipient = (id) => {
    setRecipients(prev => prev.map(r => 
      r.id === id ? { ...r, selected: !r.selected } : r
    ))
  }

  const toggleAllRecipients = () => {
    const allSelected = filteredRecipients.every(r => r.selected)
    setRecipients(prev => prev.map(r => {
      if (filteredRecipients.find(fr => fr.id === r.id)) {
        return { ...r, selected: !allSelected }
      }
      return r
    }))
  }

  // Filter and search
  const filteredRecipients = useMemo(() => {
    return recipients.filter(r => {
      const matchesSearch = searchQuery === "" || 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.toString().includes(searchQuery)
      return matchesSearch
    })
  }, [recipients, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredRecipients.length / recipientsPerPage)
  const paginatedRecipients = useMemo(() => {
    const start = (currentPage - 1) * recipientsPerPage
    return filteredRecipients.slice(start, start + recipientsPerPage)
  }, [filteredRecipients, currentPage])

  // Statistics
  const stats = useMemo(() => {
    const total = recipients.length
    const valid = recipients.filter(r => r.validation.isValid).length
    const invalid = total - valid
    const selected = recipients.filter(r => r.selected && r.validation.isValid).length
    
    return { total, valid, invalid, selected, campaigns: campaignHistory.length }
  }, [recipients, campaignHistory])

  // Insert placeholder
  const insertPlaceholder = (placeholder) => {
    const textarea = document.getElementById('message-textarea')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMessage = message.substring(0, start) + placeholder + message.substring(end)
    setMessage(newMessage)
    
    // Set cursor position after placeholder
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length)
    }, 0)
  }

  // Get personalized message preview
  const getPersonalizedPreview = () => {
    const validSelected = recipients.filter(r => r.selected && r.validation.isValid)
    if (validSelected.length === 0) return message
    
    const recipient = validSelected[previewRecipientIndex] || validSelected[0]
    return message.replace(/\{\{name\}\}/g, recipient.name)
  }

  // Validate campaign
  const validateCampaign = () => {
    const errors = []
    
    if (!campaignName.trim()) {
      errors.push('Campaign name is required')
    }
    
    if (!message.trim()) {
      errors.push('Message is required')
    }
    
    const validSelected = recipients.filter(r => r.selected && r.validation.isValid)
    if (validSelected.length === 0) {
      errors.push('At least one valid recipient must be selected')
    }
    
    return errors
  }

  // Review campaign
  const handleReviewCampaign = () => {
    const errors = validateCampaign()
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }
    
    setIsReviewModalOpen(true)
  }

  // Confirm campaign - Actually send WhatsApp messages
  const handleConfirmCampaign = async () => {
    setIsSending(true)
    
    try {
      const validSelected = recipients.filter(r => r.selected && r.validation.isValid)
      
      // Prepare recipients data (support both 'phone' and 'num' formats)
      const recipientsData = validSelected.map(r => ({
        name: r.name,
        phone: r.phone
      }))

      // Call Edge Function to send campaign
      const result = await sendWhatsAppCampaign({
        campaignName,
        message,
        recipients: recipientsData,
        mode
      })

      // Close modal
      setIsReviewModalOpen(false)
      setIsSending(false)

      // Show results
      setSendResults(result)

      // Success notification
      const { sent, failed } = result.summary || { sent: 0, failed: 0 }
      if (sent > 0) {
        toast.success(`Campaign sent! ${sent} messages sent, ${failed} failed`)
      } else {
        toast.error(`Campaign failed: ${failed} messages could not be sent`)
      }

      // Reload history
      await loadHistory()

      // Reset form
      setTimeout(() => {
        handleRemoveFile()
        setSendResults(null)
      }, 5000)

    } catch (error) {
      console.error('Error sending campaign:', error)
      setIsSending(false)
      setIsReviewModalOpen(false)
      
      // Show user-friendly error
      if (error.message.includes('configuration missing')) {
        toast.error('WhatsApp API not configured. Please add credentials in Supabase secrets.')
      } else if (error.message.includes('Unauthorized') || error.message.includes('Admin')) {
        toast.error('Admin privileges required to send campaigns')
      } else {
        toast.error(`Failed to send campaign: ${error.message}`)
      }
    }
  }

  // Filter history
  const filteredHistory = useMemo(() => {
    return campaignHistory.filter(c => {
      const matchesSearch = historySearch === "" || 
        c.name.toLowerCase().includes(historySearch.toLowerCase())
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      return matchesSearch && matchesStatus
    }).sort((a, b) => {
      // Sort by date, newest first
      const dateA = new Date(a.created_at || a.date)
      const dateB = new Date(b.created_at || b.date)
      return dateB - dateA
    })
  }, [campaignHistory, historySearch, statusFilter])

  const validSelectedRecipients = recipients.filter(r => r.selected && r.validation.isValid)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk WhatsApp Messaging</h1>
          <p className="text-gray-500 mt-1">Manage recipients, compose messages, and review campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setMode('test')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                mode === 'test'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TestTube size={14} />
              Test
            </button>
            <button
              onClick={() => setMode('production')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                mode === 'production'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Rocket size={14} />
              Production
            </button>
          </div>
          
          {recipients.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Start a new campaign? This will clear the current data.')) {
                  handleRemoveFile()
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              New Campaign
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Recipients" value={stats.total} color="blue" />
        <StatCard icon={CheckCircle} label="Valid Phone Numbers" value={stats.valid} color="green" />
        <StatCard icon={XCircle} label="Invalid Records" value={stats.invalid} color="red" />
        <StatCard icon={FileText} label="Previous Campaigns" value={stats.campaigns} color="purple" />
      </div>

      {/* JSON Upload Section */}
      {!uploadedFile ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload Customer Data</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload a JSON file containing customer names and phone numbers
              </p>
            </div>
            <button
              onClick={downloadSampleJSON}
              className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Sample JSON
            </button>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {isDragging ? 'Drop your file here' : 'Drag & drop your JSON file here'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <label className="inline-block">
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <span className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block">
                Browse Files
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-4">
              Expected format: [{"{"}"name": "John Doe", "phone": "919876543210"{"}"}]
            </p>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Processing file...</span>
            </div>
          )}
        </motion.div>
      ) : (
        <>
          {/* File Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </motion.div>

          {/* Recipients Table */}
          {recipients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Recipients</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {stats.total} total • {stats.valid} valid • {stats.invalid} invalid • {stats.selected} selected
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setCurrentPage(1)
                        }}
                        placeholder="Search by name or phone..."
                        className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={filteredRecipients.length > 0 && filteredRecipients.every(r => r.selected)}
                          onChange={toggleAllRecipients}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRecipients.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                          No recipients match your search
                        </td>
                      </tr>
                    ) : (
                      paginatedRecipients.map((recipient) => (
                        <tr key={recipient.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={recipient.selected}
                              onChange={() => toggleRecipient(recipient.id)}
                              disabled={!recipient.validation.isValid}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {recipient.name || <span className="text-gray-400 italic">No name</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {recipient.phone || <span className="text-gray-400 italic">No phone</span>}
                          </td>
                          <td className="px-6 py-4">
                            {recipient.validation.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                <CheckCircle size={12} />
                                Valid
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                  <XCircle size={12} />
                                  Invalid
                                </span>
                                <span className="text-xs text-gray-500">
                                  {recipient.validation.errors.join(', ')}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * recipientsPerPage) + 1} to {Math.min(currentPage * recipientsPerPage, filteredRecipients.length)} of {filteredRecipients.length} recipients
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Message Composer */}
          {recipients.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g., New Year Promotion"
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message-textarea"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={6}
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => insertPlaceholder('{{name}}')}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          + {"{{name}}"}
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        {message.length} characters
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setCampaignName("")
                        setMessage("")
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Message Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Preview</h2>
                
                {validSelectedRecipients.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preview for:
                      </label>
                      <select
                        value={previewRecipientIndex}
                        onChange={(e) => setPreviewRecipientIndex(Number(e.target.value))}
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {validSelectedRecipients.map((recipient, index) => (
                          <option key={recipient.id} value={index}>
                            {recipient.name} ({recipient.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle size={16} className="text-green-600" />
                        <span className="text-xs font-medium text-green-800">WhatsApp Message</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {message ? getPersonalizedPreview() : 'Your message will appear here...'}
                        </p>
                      </div>
                    </div>

                    {message.includes('{{') && message.includes('}}') && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">
                          Placeholders like {"{{name}}"} will be replaced with actual recipient data
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-12 text-center">
                    <Eye size={32} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Select recipients to preview personalized messages
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Campaign Review Panel */}
          {recipients.length > 0 && !sendResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-sm p-6 border border-green-200"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to Review?</h2>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      • Campaign: {campaignName || <span className="text-gray-400 italic">Not set</span>}
                    </p>
                    <p className="text-sm text-gray-600">
                      • Selected Recipients: <span className="font-semibold text-green-600">{stats.selected}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      • Message Length: <span className="font-semibold text-blue-600">{message.length} characters</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      • Mode: <span className={`font-semibold ${mode === 'test' ? 'text-blue-600' : 'text-green-600'}`}>
                        {mode === 'test' ? 'Test' : 'Production'}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReviewCampaign}
                  className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Eye size={18} />
                  Review Campaign
                </button>
              </div>
            </motion.div>
          )}

          {/* Send Results Display */}
          {sendResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg border-2 border-green-200 overflow-hidden"
            >
              <div className="bg-green-50 border-b border-green-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Campaign Sent!</h3>
                      <p className="text-sm text-gray-600">Results from: {campaignName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSendResults(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{sendResults.summary?.total || 0}</div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{sendResults.summary?.sent || 0}</div>
                    <div className="text-sm text-gray-500">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{sendResults.summary?.failed || 0}</div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                </div>

                {/* Detailed Results */}
                {sendResults.results && sendResults.results.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Results</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {sendResults.results.map((result, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            result.status === 'sent'
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {result.status === 'sent' ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : (
                              <XCircle size={16} className="text-red-600" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{result.name}</p>
                              <p className="text-xs text-gray-500">{result.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {result.status === 'sent' ? (
                              <span className="text-xs text-green-700">Sent</span>
                            ) : (
                              <span className="text-xs text-red-700">{result.error || 'Failed'}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Campaign History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Campaign History</h2>
              <p className="text-sm text-gray-500 mt-1">
                View past campaigns {historyLoading && '(loading...)'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search campaigns..."
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                    No campaigns found
                  </td>
                </tr>
              ) : (
                filteredHistory.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(campaign.created_at || campaign.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.total_recipients || campaign.recipients || 0}
                      {campaign.sent_count !== undefined && campaign.sent_count !== campaign.total_recipients && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({campaign.sent_count} sent)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        campaign.status === 'completed' 
                          ? 'text-green-700 bg-green-100'
                          : campaign.status === 'processing'
                          ? 'text-blue-700 bg-blue-100'
                          : campaign.status === 'pending'
                          ? 'text-yellow-700 bg-yellow-100'
                          : 'text-red-700 bg-red-100'
                      }`}>
                        {campaign.status === 'completed' && <CheckCircle size={12} />}
                        {campaign.status || 'completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {campaign.mode && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            campaign.mode === 'test'
                              ? 'text-blue-700 bg-blue-100'
                              : 'text-green-700 bg-green-100'
                          }`}>
                            {campaign.mode === 'test' ? <TestTube size={12} /> : <Rocket size={12} />}
                            {campaign.mode}
                          </span>
                        )}
                        {campaign.type === 'demo' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                            Demo
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        campaign={{ name: campaignName, message }}
        recipients={recipients}
        mode={mode}
        onConfirm={handleConfirmCampaign}
        isSending={isSending}
      />
    </div>
  )
}
