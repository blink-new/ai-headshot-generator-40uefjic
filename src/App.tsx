import { useState, useEffect } from 'react'
import { Camera, Sparkles, Upload, Download, RefreshCw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { blink } from './blink/client'

interface GeneratedHeadshot {
  id: string
  url: string
  style: string
  createdAt: string
}

const headshotStyles = [
  { value: 'professional', label: 'Professional Business', description: 'Classic corporate headshot with studio lighting' },
  { value: 'creative', label: 'Creative Professional', description: 'Modern artistic style with creative backgrounds' },
  { value: 'corporate', label: 'Corporate Executive', description: 'Premium executive portrait with formal attire' },
  { value: 'casual', label: 'Casual Professional', description: 'Approachable and friendly professional look' },
  { value: 'tech', label: 'Tech Industry', description: 'Modern tech professional with clean aesthetic' },
  { value: 'consultant', label: 'Consultant', description: 'Confident and trustworthy professional image' }
]

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [generatedHeadshots, setGeneratedHeadshots] = useState<GeneratedHeadshot[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive"
        })
        return
      }
      
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateHeadshots = async () => {
    if (!selectedFile || !selectedStyle) {
      toast({
        title: "Missing requirements",
        description: "Please upload a photo and select a style",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Get the selected style details
      const styleDetails = headshotStyles.find(s => s.value === selectedStyle)
      
      // Upload the image to get a URL
      const { publicUrl } = await blink.storage.upload(
        selectedFile,
        `headshots/original/${user?.id}/${Date.now()}.jpg`,
        { upsert: true }
      )

      // Generate professional headshots using AI
      const { data } = await blink.ai.modifyImage({
        images: [publicUrl],
        prompt: `Generate a professional business headshot for this person. ${styleDetails?.description}. Use professional studio lighting, formal business attire, neutral background. High quality, sharp focus, professional photography style. Make the person look confident and approachable.`,
        quality: 'hd',
        n: 4
      })

      // Store the generated headshots
      const newHeadshots = data.map((result, index) => ({
        id: `${Date.now()}-${index}`,
        url: result.url,
        style: selectedStyle,
        createdAt: new Date().toISOString()
      }))

      setGeneratedHeadshots(prev => [...newHeadshots, ...prev])
      
      toast({
        title: "Success!",
        description: `Generated ${data.length} professional headshots`,
      })
      
    } catch (error) {
      console.error('Error generating headshots:', error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again with a different image",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast({
        title: "Downloaded!",
        description: "Your headshot has been saved",
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your AI studio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Headshot Studio</h1>
                <p className="text-sm text-gray-600">Professional headshots in seconds</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              {user && (
                <div className="text-sm text-gray-600">
                  Welcome, {user.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Upload Your Photo</span>
                </CardTitle>
                <CardDescription>
                  Choose a clear photo of yourself for the best results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photo">Select Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>

                {uploadedImage && (
                  <div className="mt-4">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Style Selection */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span>Choose Style</span>
                </CardTitle>
                <CardDescription>
                  Select the professional style that matches your industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="style">Headshot Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a professional style" />
                    </SelectTrigger>
                    <SelectContent>
                      {headshotStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{style.label}</span>
                            <span className="text-xs text-gray-500">{style.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateHeadshots}
                  disabled={!selectedFile || !selectedStyle || isGenerating}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Your Headshots...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Professional Headshots
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-green-600" />
                  <span>Your Professional Headshots</span>
                </CardTitle>
                <CardDescription>
                  High-quality AI-generated professional headshots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedHeadshots.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No headshots generated yet</p>
                    <p className="text-sm text-gray-400">
                      Upload a photo and select a style to get started
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {generatedHeadshots.map((headshot) => (
                      <div key={headshot.id} className="relative group">
                        <img
                          src={headshot.url}
                          alt={`Professional headshot - ${headshot.style}`}
                          className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            onClick={() => downloadImage(headshot.url, `headshot-${headshot.id}.jpg`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 hover:bg-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs">
                            {headshotStyles.find(s => s.value === headshot.style)?.label}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose AI Headshot Studio?</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Get professional-quality headshots in minutes, not days. Perfect for LinkedIn, business cards, and professional websites.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Generate multiple professional headshots in under 60 seconds</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Powered</h3>
              <p className="text-gray-600">Advanced AI technology for studio-quality results</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Quality</h3>
              <p className="text-gray-600">Industry-standard headshots perfect for any profession</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App