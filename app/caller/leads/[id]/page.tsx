'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, FlatList, Pressable,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { useParams, useRouter } from 'next/navigation';
import {
  API_ROUTES, LEAD_STAGES, STAGE_LABELS, STAGE_COLORS,
  CALL_STATUSES, CALL_STATUS_LABELS,
} from '@/lib/constants';
import EditLeadModal from '@/app/components/EditLeadModal';
import type { Lead, LeadStage } from '@/types/lead.types';
import type { CallLog, CallStatus } from '@/types/call.types';

interface PhotoPreview {
  uri: string;
  file: File;
}

export default function CallerLeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCallForm, setShowCallForm] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('answered');
  const [callNotes, setCallNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [changingStage, setChangingStage] = useState(false);
  const [selectedStages, setSelectedStages] = useState<LeadStage[]>([]);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem('token') || '';

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/calls`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok) setCalls(json.data);
    } catch { /* non-critical */ }
  }, [leadId]);

  useEffect(() => { fetchLead(); fetchCalls(); }, [fetchLead, fetchCalls]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoPreview[] = [];
    const maxTotal = 10;
    const remaining = maxTotal - photos.length;

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newPhotos.push({
          uri: URL.createObjectURL(file),
          file,
        });
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].uri);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      photos.forEach((p) => formData.append('photos', p.file));

      const res = await fetch(API_ROUTES.UPLOAD_CALL_PHOTOS, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data.urls;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleLogCall = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Upload photos first
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos();
      }

      const body: Record<string, unknown> = { status: callStatus };
      if (callNotes.trim()) body.notes = callNotes.trim();
      if (callbackDate) body.callback_date = new Date(callbackDate).toISOString();
      if (photoUrls.length > 0) body.photo_urls = photoUrls;

      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Call logged successfully');
      setShowCallForm(false);
      setCallStatus('answered');
      setCallNotes('');
      setCallbackDate('');
      // Clean up photo previews
      photos.forEach((p) => URL.revokeObjectURL(p.uri));
      setPhotos([]);
      fetchCalls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log call');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStage = (stage: LeadStage) => {
    if (!lead || changingStage) return;
    if (stage === lead.stage) return; // can't deselect current stage
    setSelectedStages((prev) => {
      if (prev.includes(stage)) {
        return prev.filter((s) => s !== stage);
      } else {
        return [...prev, stage];
      }
    });
  };

  const handleConfirmStages = async () => {
    if (!lead || selectedStages.length === 0 || changingStage) return;
    try {
      setChangingStage(true);
      setError('');
      setSuccess('');
      // Determine overall direction: are we advancing or reverting?
      // Sort the stages based on the predefined funnel order
      const currentIdx = LEAD_STAGES.indexOf(lead.stage);
      const sortedStages = [...selectedStages].sort((a, b) => {
        return LEAD_STAGES.indexOf(a) - LEAD_STAGES.indexOf(b);
      });

      // If all selected stages are BEFORE the current stage (going backwards),
      // we should sort them in reverse so the user steps backwards correctly
      const isReverting = sortedStages.every((s) => LEAD_STAGES.indexOf(s) < currentIdx);
      if (isReverting) {
        sortedStages.reverse();
      }

      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ stages: sortedStages }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
      const stageNames = selectedStages.map((s) => STAGE_LABELS[s]).join(', ');
      setSuccess(`Stages updated: ${stageNames}`);
      setSelectedStages([]);
      fetchCalls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stages');
    } finally {
      setChangingStage(false);
    }
  };

  if (loading) return <ActivityIndicator color="#22c55e" size="large" style={{ marginTop: 48 }} />;
  if (!lead) return <Text style={styles.errorText}>Lead not found</Text>;



  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back to Leads</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{lead.school_name}</Text>
            <Text style={styles.meta}>
              {[lead.city, lead.state].filter(Boolean).join(', ') || 'No location'}
              {lead.board ? ` • ${lead.board}` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
        {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Numbers</Text>
          {lead.principal_phone ? (
            <Pressable style={styles.phoneChip}>
              <Text style={styles.phoneLabel}>📞 {lead.principal_name || 'Principal'}</Text>
              <Text style={styles.phoneNumber}>{lead.principal_phone}</Text>
            </Pressable>
          ) : null}
          {lead.chairman_phone ? (
            <Pressable style={styles.phoneChip}>
              <Text style={styles.phoneLabel}>📞 {lead.chairman_name || 'Chairman'}</Text>
              <Text style={styles.phoneNumber}>{lead.chairman_phone}</Text>
            </Pressable>
          ) : null}
          {!lead.principal_phone && !lead.chairman_phone ? (
            <Text style={styles.emptyText}>No contact numbers available</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stage</Text>
          {changingStage && (
            <View style={styles.stageLoading}>
              <ActivityIndicator color="#22c55e" size="small" />
              <Text style={styles.stageLoadingText}>Updating stages...</Text>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {LEAD_STAGES.map((s) => {
              const isCurrent = lead.stage === s;
              const isSelected = selectedStages.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.stageChip,
                    isCurrent && { backgroundColor: STAGE_COLORS[s] + '30', borderColor: STAGE_COLORS[s], borderWidth: 1 },
                    isSelected && !isCurrent && { backgroundColor: STAGE_COLORS[s] + '20', borderColor: STAGE_COLORS[s], borderWidth: 1, borderStyle: 'dashed' as const },
                  ]}
                  onPress={() => toggleStage(s)}
                  disabled={changingStage || isCurrent}
                  activeOpacity={isCurrent ? 1 : 0.6}
                >
                  <Text style={[styles.stageChipText, { color: isCurrent ? STAGE_COLORS[s] : isSelected ? STAGE_COLORS[s] : 'var(--color-text-secondary)' }]}>
                    {isSelected && !isCurrent ? '✓ ' : ''}{STAGE_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {selectedStages.length > 0 && (
            <View style={styles.stageConfirmRow}>
              <TouchableOpacity
                style={styles.stageCancelBtn}
                onPress={() => setSelectedStages([])}
                disabled={changingStage}
              >
                <Text style={styles.stageCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stageConfirmBtn, changingStage && { opacity: 0.6 }]}
                onPress={handleConfirmStages}
                disabled={changingStage}
              >
                {changingStage ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.stageConfirmBtnText}>Confirm ({selectedStages.length})</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call History ({calls.length})</Text>
          {calls.length === 0 ? (
            <Text style={styles.emptyText}>No calls logged yet — start calling!</Text>
          ) : (
            <FlatList
              data={calls}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.callCard}>
                  <View style={styles.callHeader}>
                    <Text style={styles.callStatusText}>{item.status.replace('_', ' ')}</Text>
                    <Text style={styles.callDate}>{new Date(item.called_at).toLocaleDateString()}</Text>
                  </View>
                  {item.caller ? (
                    <Text style={styles.callAuthor}>
                      By: {item.caller.full_name} ({item.caller.role === 'team_lead' ? 'Director Sales' : item.caller.role === 'caller' ? 'Sales Executive' : 'Admin'})
                    </Text>
                  ) : null}
                  {item.notes ? <Text style={styles.callNotes}>{item.notes}</Text> : null}
                  {item.callback_date ? (
                    <Text style={styles.callbackText}>
                      🔔 Callback: {new Date(item.callback_date).toLocaleDateString()}
                    </Text>
                  ) : null}
                  {/* Call photos thumbnails */}
                  {item.photos && item.photos.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.callPhotoRow}
                    >
                      {item.photos.map((photo) => (
                        <Pressable
                          key={photo.id}
                          onPress={() => setLightboxUrl(photo.photo_url)}
                        >
                          <Image
                            source={{ uri: photo.photo_url }}
                            style={styles.callPhotoThumb}
                            resizeMode="cover"
                          />
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {showCallForm && (
        <View style={styles.bottomSheet}>
          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Log Call</Text>

            <Text style={styles.sheetLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
              {CALL_STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, callStatus === s && styles.statusChipActive]}
                  onPress={() => setCallStatus(s)}
                >
                  <Text style={[styles.statusChipText, callStatus === s && styles.statusChipTextActive]}>
                    {CALL_STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sheetLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Call notes..."
              placeholderTextColor="#64748b"
              value={callNotes}
              onChangeText={setCallNotes}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.sheetLabel}>Callback Date (optional)</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={callbackDate}
              onChangeText={setCallbackDate}
            />

            {/* Photo capture / upload section */}
            <Text style={styles.sheetLabel}>Photos</Text>
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => cameraInputRef.current?.click()}
              >
                <Text style={styles.photoBtnText}>📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => galleryInputRef.current?.click()}
              >
                <Text style={styles.photoBtnText}>📁 Upload</Text>
              </TouchableOpacity>
            </View>

            {/* Hidden native file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect as unknown as React.FormEventHandler<HTMLInputElement>}
              style={{ display: 'none' }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect as unknown as React.FormEventHandler<HTMLInputElement>}
              style={{ display: 'none' }}
            />

            {/* Photo preview thumbnails */}
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewRow}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.previewContainer}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.previewThumb}
                      resizeMode="cover"
                    />
                    <Pressable
                      style={styles.removePhotoBtn}
                      onPress={() => removePhoto(index)}
                    >
                      <Text style={styles.removePhotoBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {photos.length < 10 && (
                  <Pressable
                    style={styles.addMoreBtn}
                    onPress={() => galleryInputRef.current?.click()}
                  >
                    <Text style={styles.addMoreText}>+</Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
            {photos.length > 0 && (
              <Text style={styles.photoCountText}>{photos.length}/10 photos</Text>
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setShowCallForm(false);
                photos.forEach((p) => URL.revokeObjectURL(p.uri));
                setPhotos([]);
              }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitCallBtn, (submitting || uploadingPhotos) && styles.submitCallBtnDisabled]}
                onPress={handleLogCall}
                disabled={submitting || uploadingPhotos}
              >
                {submitting || uploadingPhotos ? (
                  <View style={styles.submitLoadingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitCallBtnText}>
                      {uploadingPhotos ? ' Uploading...' : ' Saving...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitCallBtnText}>Log Call</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {!showCallForm && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowCallForm(true)}>
          <Text style={styles.fabText}>📞 Log Call</Text>
        </TouchableOpacity>
      )}

      {/* Lightbox overlay for full-size photo view */}
      {lightboxUrl && (
        <Pressable
          style={styles.lightboxOverlay}
          onPress={() => setLightboxUrl(null)}
        >
          <View style={styles.lightboxContainer}>
            <Pressable
              style={styles.lightboxClose}
              onPress={() => setLightboxUrl(null)}
            >
              <Text style={styles.lightboxCloseText}>✕</Text>
            </Pressable>
            <Image
              source={{ uri: lightboxUrl }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      )}

      <EditLeadModal
        lead={lead}
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={setLead}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 80, padding: 20 },
  backBtn: { marginBottom: 12, alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 16 },
  backBtnText: { color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: '600', fontFamily: 'Poppins' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  titleContainer: { flex: 1, paddingRight: 12 },
  title: { fontSize: 22, fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: 4 },
  meta: { fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 },
  editBtn: { backgroundColor: 'var(--color-border)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { color: 'var(--color-text-primary)', fontSize: 13, fontWeight: '600' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 14 },
  successBox: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  successText: { color: '#22c55e', fontSize: 14 },
  section: { backgroundColor: 'var(--color-surface-lighter)', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 12 },
  phoneChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'var(--color-surface)',
    borderRadius: 12, padding: 16, marginBottom: 8, minHeight: 56, gap: 12,
  },
  phoneLabel: { fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: '500' },
  phoneNumber: { fontSize: 18, color: '#22c55e', fontWeight: '700' },
  emptyText: { fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', paddingVertical: 12 },
  stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: 'var(--color-surface)', marginRight: 6, borderWidth: 1, borderColor: 'transparent' },
  stageChipText: { fontSize: 12, fontWeight: '600' },
  stageLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  stageLoadingText: { fontSize: 12, color: 'var(--color-text-secondary)' },
  stageConfirmRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stageCancelBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: 'var(--color-border)', alignItems: 'center' },
  stageCancelBtnText: { color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: 13 },
  stageConfirmBtn: { flex: 2, padding: 10, borderRadius: 8, backgroundColor: '#16a34a', alignItems: 'center' },
  stageConfirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  callCard: { backgroundColor: 'var(--color-surface)', borderRadius: 8, padding: 12, marginBottom: 8 },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  callStatusText: { fontSize: 14, color: '#22c55e', fontWeight: '600', textTransform: 'capitalize' },
  callDate: { fontSize: 12, color: 'var(--color-text-muted)' },
  callAuthor: { fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: 2, marginBottom: 4 },
  callNotes: { fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 },
  callbackText: { fontSize: 12, color: '#f59e0b', marginTop: 4 },
  // Call history photo thumbnails
  callPhotoRow: { marginTop: 8, flexDirection: 'row' },
  callPhotoThumb: {
    width: 56, height: 56, borderRadius: 8, marginRight: 6,
    borderWidth: 1, borderColor: 'var(--color-border)',
  },
  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    maxHeight: '85%',
    backgroundColor: 'var(--color-surface-lighter)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  sheetScroll: { flexGrow: 0 },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#475569',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: 16 },
  sheetLabel: { fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8, marginTop: 8 },
  statusRow: { flexDirection: 'row', marginBottom: 4 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: 'var(--color-surface)', marginRight: 6 },
  statusChipActive: { backgroundColor: '#16a34a' },
  statusChipText: { fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: '500' },
  statusChipTextActive: { color: 'var(--color-text-primary)' },
  notesInput: {
    minHeight: 80, borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)', textAlignVertical: 'top',
  },
  sheetInput: {
    height: 48, borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 10,
    paddingHorizontal: 16, fontSize: 14, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)',
  },
  // Photo action buttons
  photoActions: {
    flexDirection: 'row', gap: 10, marginBottom: 4,
  },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'var(--color-surface)', borderRadius: 10, paddingVertical: 12,
    borderWidth: 1, borderColor: 'var(--color-border)', borderStyle: 'dashed',
  },
  photoBtnText: { color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: '500' },
  // Photo previews
  previewRow: { flexDirection: 'row', marginTop: 8, marginBottom: 4 },
  previewContainer: { position: 'relative', marginRight: 8 },
  previewThumb: {
    width: 64, height: 64, borderRadius: 8,
    borderWidth: 1, borderColor: 'var(--color-border)',
  },
  removePhotoBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  removePhotoBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addMoreBtn: {
    width: 64, height: 64, borderRadius: 8,
    borderWidth: 1, borderColor: 'var(--color-border)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'var(--color-surface)',
  },
  addMoreText: { color: 'var(--color-text-muted)', fontSize: 24, fontWeight: '300' },
  photoCountText: { color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 4 },
  // Sheet actions
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: 'var(--color-border)', alignItems: 'center', minHeight: 48 },
  cancelBtnText: { color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: 15 },
  submitCallBtn: { flex: 2, padding: 14, borderRadius: 10, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  submitCallBtnDisabled: { opacity: 0.6 },
  submitCallBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  submitLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: '#16a34a', borderRadius: 14, padding: 16,
    alignItems: 'center', minHeight: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Lightbox
  lightboxOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
  },
  lightboxContainer: {
    width: '90%', height: '80%',
    justifyContent: 'center', alignItems: 'center',
  },
  lightboxImage: { width: '100%', height: '100%' },
  lightboxClose: {
    position: 'absolute', top: -40, right: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 101,
  },
  lightboxCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
