import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Trash2, 
  Upload as UploadIcon,
  FileSpreadsheet,
  File,
  Clock
} from 'lucide-react';

interface PitchMaterial {
  id: string;
  title: string;
  materialType: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

export default function PitchMaterials() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<PitchMaterial[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch('/api/pitch/materials', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/auth');
        }
        return;
      }

      const data = await response.json();
      setMaterials(data || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('materialType', selectedFile.type);
      formData.append('title', title || selectedFile.name);
      formData.append('description', '');

      const response = await fetch('/api/pitch/materials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        alert('Failed to upload file');
        return;
      }

      setShowUploadDialog(false);
      setSelectedFile(null);
      setTitle('');
      fetchMaterials();

    } catch (err) {
      console.error('Error:', err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (material: PitchMaterial) => {
    try {
      window.open(`/uploads/${material.filePath}`, '_blank');
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (material: PitchMaterial) => {
    if (!confirm(`Are you sure you want to delete ${material.title}?`)) {
      return;
    }

    try {
      if (!token) return;

      const response = await fetch(`/api/pitch/materials/${material.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert('Failed to delete file');
        return;
      }

      fetchMaterials();

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getFileIcon = (materialType: string) => {
    if (materialType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <FileText className="h-8 w-8 text-orange-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pitch Materials</h1>
            <p className="text-muted-foreground">
              Upload and manage your pitch decks, financial projections, and other materials
            </p>
          </div>
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Pitch Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Pitch Deck Q1 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Choose File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleUpload} 
                  className="w-full"
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Materials Grid */}
        {materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card key={material.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(material.materialType)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" title={material.title}>
                          {material.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(material.fileSize)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Uploaded: {formatDate(material.uploadedAt)}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(material)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(material)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No pitch materials yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your pitch deck, financial projections, and other materials to share with investors
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Your First Material
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
