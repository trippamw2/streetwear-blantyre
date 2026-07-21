import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Star, Loader2, User, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  rating: number;
  image: string;
  is_active: boolean;
  sort_order: number;
}

export const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    message: "",
    rating: 5,
    image: "",
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });
    setTestimonials(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        is_active: true,
        sort_order: testimonials.length + 1,
      };

      if (editingTestimonial) {
        await supabase.from("testimonials").update(payload).eq("id", editingTestimonial.id);
        toast({ title: "Testimonial updated!" });
      } else {
        await supabase.from("testimonials").insert(payload);
        toast({ title: "Testimonial added!" });
      }

      setIsDialogOpen(false);
      setEditingTestimonial(null);
      resetForm();
      fetchTestimonials();
    } catch {
      toast({ title: "Error saving testimonial", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this testimonial?")) {
      await supabase.from("testimonials").delete().eq("id", id);
      fetchTestimonials();
      toast({ title: "Testimonial deleted" });
    }
  };

  const handleEdit = (t: Testimonial) => {
    setEditingTestimonial(t);
    setFormData({
      name: t.name,
      role: t.role || "",
      message: t.message,
      rating: t.rating,
      image: t.image || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      message: "",
      rating: 5,
      image: "",
    });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">Testimonials</h1>
          <p className="text-gray-500">Manage customer reviews</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTestimonial(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4" /> Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John Phiri"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Role/Title</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Student, Lilongwe"
                />
              </div>

              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="What did they say about Streetwear Blantyre..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= formData.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo URL (optional)</Label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={saving || !formData.name || !formData.message}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTestimonial ? "Update" : "Add"} Testimonial
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${
                      j < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(t)} className="p-1 hover:bg-gray-100 rounded">
                  <Edit className="h-4 w-4 text-gray-500" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-1 hover:bg-red-50 rounded">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">"{t.message}"</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <MessageCircle className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No testimonials yet. Add the first one!</p>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;