import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import {
  X,
  ShoppingCart,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  MessageSquare,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useSurveyRequest } from "./SurveyRequestCart";

interface CartDrawerProps {
  vesselId: number;
  companyId?: number;
}

export function CartDrawer({ vesselId, companyId }: CartDrawerProps) {
  const { state, removeItem, clearCart, toggleCart } = useSurveyRequest();
  const fetcher = useFetcher();
  const [formData, setFormData] = useState({
    location: "",
    estimated_date: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    comments: "",
  });
  const prevSuccessRef = useRef<boolean | undefined>(undefined);

  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;
  const hasError = fetcher.data?.error;

  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current) {
      clearCart();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        location: "",
        estimated_date: "",
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        comments: "",
      });
      const timer = setTimeout(() => toggleCart(false), 2000);
      return () => clearTimeout(timer);
    }
    prevSuccessRef.current = isSuccess;
  }, [isSuccess, clearCart, toggleCart]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cartItems = state.selectedItems.map((item) => ({
      ship_id: vesselId,
      company_id: companyId || null,
      survey_audit_id: item.type === "survey" ? item.id : null,
      comment_id: item.type === "finding" ? item.id : null,
      occ_survey_code: item.type === "other" ? item.code : null,
    }));

    fetcher.submit(
      {
        intent: "submit_survey_request",
        payload: JSON.stringify({
          requestData: {
            ship_id: vesselId,
            company_id: companyId,
            ...formData,
          },
          cartItems,
        }),
      },
      { method: "POST" },
    );
  };

  if (!state.showCart) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => toggleCart(false)}
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-linear-to-r from-[#005EAA] to-[#0077cc]">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Survey Request</h2>
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {state.selectedItems.length}
            </span>
          </div>
          <button
            onClick={() => toggleCart(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {isSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">
                  Request submitted successfully!
                </span>
              </div>
            )}
            {hasError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-800">{fetcher.data.error}</span>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Selected Items
              </h3>
              {state.selectedItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {state.selectedItems.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-[#005EAA]/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              item.type === "survey"
                                ? "bg-blue-100 text-blue-700"
                                : item.type === "finding"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{item.code}</span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-900 truncate">
                          {item.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.type)}
                        className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Request Details
              </h3>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Singapore Port"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#005EAA] focus:ring-1 focus:ring-[#005EAA] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Estimated Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.estimated_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_date: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#005EAA] focus:ring-1 focus:ring-[#005EAA] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                    placeholder="Full name"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#005EAA] focus:ring-1 focus:ring-[#005EAA] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_phone: e.target.value,
                        })
                      }
                      placeholder="+1 234 567 890"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#005EAA] focus:ring-1 focus:ring-[#005EAA] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_email: e.target.value,
                        })
                      }
                      placeholder="email@example.com"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#005EAA] focus:ring-1 focus:ring-[#005EAA] outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Comments
                  </label>
                  <textarea
                    rows={3}
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Additional notes..."
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#005EAA] focus:ring-1 focus:ring-[#005EAA] outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <button
              type="submit"
              disabled={state.selectedItems.length === 0 || isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#005EAA] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#004a85] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FloatingCartButton() {
  const { state, toggleCart } = useSurveyRequest();
  const count = state.selectedItems.length;

  return (
    <button
      onClick={() => toggleCart()}
      className="fixed bottom-6 right-6 z-40 bg-[#005EAA] text-white p-4 rounded-full shadow-lg hover:bg-[#004a85] transition-all hover:scale-105 active:scale-95"
    >
      <ShoppingCart className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
          {count}
        </span>
      )}
    </button>
  );
}
