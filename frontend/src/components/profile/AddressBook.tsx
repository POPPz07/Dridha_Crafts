"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Star,
  Check,
  Loader2,
  AlertCircle,
  Home,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import type { Address } from "@/types/user";

interface AddressFormData {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
}

const INITIAL_FORM: AddressFormData = {
  full_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchAddresses = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await api.get<Address[]>("/api/addresses");
      setAddresses(data || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Could not load saved addresses. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    setFormData(INITIAL_FORM);
    setFormError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate 10-digit Indian phone
    const cleanPhone = formData.phone.replace(/[^\d]/g, "").slice(-10);
    if (cleanPhone.length < 10) {
      setFormError("Enter a valid 10-digit mobile number (required for delivery coordination)");
      return;
    }

    // Validate pincode
    const cleanPin = formData.pincode.replace(/[^\d]/g, "").slice(0, 6);
    if (cleanPin.length !== 6) {
      setFormError("Enter a valid 6-digit Indian PIN code");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: cleanPhone,
        address_line_1: formData.address_line_1.trim(),
        address_line_2: formData.address_line_2?.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: cleanPin,
      };

      if (editingAddress) {
        await api.put<Address>(`/api/addresses/${editingAddress.id}`, payload);
        setSuccessMessage("Address updated successfully.");
      } else {
        await api.post<Address>("/api/addresses", payload);
        setSuccessMessage("New address added successfully.");
      }

      closeModal();
      await fetchAddresses();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save address. Please check all fields.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (addrId: string) => {
    try {
      await api.put<Address>(`/api/addresses/${addrId}/default`);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === addrId,
        }))
      );
      setSuccessMessage("Default address updated.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Could not update default address.");
    }
  };

  const handleDelete = async (addrId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/api/addresses/${addrId}`);
      setAddresses((prev) => prev.filter((a) => a.id !== addrId));
      setSuccessMessage("Address deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Could not delete address.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-warmgrey/80 shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-warmgrey/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-green flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-gold" /> Saved Addresses
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/60 mt-0.5">
            Manage your delivery destinations for fast one-tap checkout
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Add New Address
        </Button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mx-6 mt-4 p-3 bg-terracotta/10 border border-terracotta/30 text-terracotta rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-brand-green mx-auto" />
            <p className="text-xs font-medium text-brand-green">Loading addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-12 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-brand-cream border border-warmgrey/80 flex items-center justify-center mx-auto text-charcoal/40">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm text-charcoal">No Saved Addresses</p>
            <p className="text-xs text-charcoal/60 leading-relaxed">
              Add your primary home or office delivery address for swift, seamless order placement.
            </p>
            <Button variant="outline" size="sm" onClick={openAddModal} className="mt-2">
              <Plus className="w-4 h-4 mr-1.5" /> Add First Address
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  addr.is_default
                    ? "border-brand-green/60 bg-brand-green/[0.02] shadow-xs"
                    : "border-warmgrey/80 bg-white hover:border-brand-green/30"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-brand-green flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-brand-gold shrink-0" />
                      {addr.full_name}
                    </span>
                    {addr.is_default && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-brand-green" /> Default
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-charcoal/60">Phone: +91 {addr.phone}</p>

                  <p className="text-xs text-charcoal/80 leading-relaxed pt-1">
                    {addr.address_line_1}
                    {addr.address_line_2 ? `, ${addr.address_line_2}` : ""}
                    <br />
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-3 border-t border-warmgrey/60 flex items-center justify-between gap-2 text-xs">
                  {!addr.is_default ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-charcoal/60 hover:text-brand-green font-medium transition-colors"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-[11px] text-brand-green font-semibold">Primary Address</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(addr)}
                      className="p-1.5 rounded-lg text-charcoal/60 hover:text-brand-green hover:bg-brand-cream transition-colors"
                      title="Edit address"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 rounded-lg text-charcoal/60 hover:text-terracotta hover:bg-terracotta/10 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add / Edit Address */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-warmgrey/80 shadow-medium w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-warmgrey/60 pb-3">
              <h3 className="font-display text-lg font-bold text-brand-green">
                {editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-charcoal/40 hover:text-charcoal text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-terracotta/10 border border-terracotta/30 text-terracotta rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-charcoal/70 uppercase text-[10px] tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Recipient's Name"
                    className="w-full px-3 py-2 bg-brand-cream rounded-xl border border-warmgrey outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-charcoal/70 uppercase text-[10px] tracking-wider">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2 bg-brand-cream rounded-xl border border-warmgrey outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-charcoal/70 uppercase text-[10px] tracking-wider">
                  Address Line 1 (Flat, House, Building) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address_line_1}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                  placeholder="e.g. Flat 302, Pine Residency"
                  className="w-full px-3 py-2 bg-brand-cream rounded-xl border border-warmgrey outline-none focus:border-brand-green"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-charcoal/70 uppercase text-[10px] tracking-wider">
                  Address Line 2 (Street, Landmark) (Optional)
                </label>
                <input
                  type="text"
                  value={formData.address_line_2}
                  onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                  placeholder="e.g. Near Rose Garden, Dharampeth"
                  className="w-full px-3 py-2 bg-brand-cream rounded-xl border border-warmgrey outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-charcoal/70 uppercase text-[10px] tracking-wider">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Nagpur"
                    className="w-full px-3 py-2 bg-brand-cream rounded-xl border border-warmgrey outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-charcoal/70 uppercase text-[10px] tracking-wider">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 bg-brand-cream rounded-xl border border-warmgrey outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-charcoal/70 uppercase text-[10px] tracking-wider">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="6 digits"
                    className="w-full px-3 py-2 bg-brand-cream rounded-xl border border-warmgrey outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-warmgrey/60 mt-4">
                <Button type="button" variant="outline" size="sm" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  {editingAddress ? "Update Address" : "Save Address"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
