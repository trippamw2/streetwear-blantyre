import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Star, Loader2, User, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  rating: number;
  image: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const Testimonials = ({ className }: { className?: string }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (data && data.length > 0) {
      setTestimonials(data);
    } else {
      setTestimonials(getDefaultTestimonials());
    }
    setLoading(false);
  };

  const getDefaultTestimonials = (): Testimonial[] => [
    {
      id: "t1",
      name: "Chimwemwe Phiri",
      role: "Student, Lilongwe",
      message: "Streetwear Blantyre changed my campus style! Best quality fits and the delivery was super fast.",
      rating: 5,
      image: "",
      is_active: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: "t2",
      name: "Grace Banda",
      role: "Business Owner, Blantyre",
      message: "Best fits in Blantyre! My friends always compliment my style. Fast delivery across Malawi!",
      rating: 5,
      image: "",
      is_active: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: "t3",
      name: "Davies Mkandawire",
      role: "Tech Enthusiast, Mzuzu",
      message: "Genuine products at great prices. The wireless charger is a game changer for my desk setup.",
      rating: 4,
      image: "",
      is_active: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
    },
  ];

  if (loading) return null;

  return (
    <section className={`py-12 ${className}`}>
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl">What Customers Say</h2>
          <p className="text-muted-foreground mt-2">Real reviews from real Streetwear Blantyre customers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl bg-card border border-border/60 p-5"
            >
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${
                      j < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4">"{t.message}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

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

      {/* Testimonials Grid */}
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

export default Testimonials;