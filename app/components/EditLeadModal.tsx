import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { API_ROUTES } from '@/lib/constants';
import type { Lead } from '@/types/lead.types';

interface EditLeadModalProps {
  lead: Lead;
  visible: boolean;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
}

export default function EditLeadModal({ lead, visible, onClose, onUpdate }: EditLeadModalProps) {
  const [schoolName, setSchoolName] = useState(lead.school_name || '');
  const [location, setLocation] = useState(lead.location || '');
  const [city, setCity] = useState(lead.city || '');
  const [stateName, setStateName] = useState(lead.state || '');
  const [board, setBoard] = useState(lead.board || '');
  const [principalName, setPrincipalName] = useState(lead.principal_name || '');
  const [principalPhone, setPrincipalPhone] = useState(lead.principal_phone || '');
  const [chairmanName, setChairmanName] = useState(lead.chairman_name || '');
  const [chairmanPhone, setChairmanPhone] = useState(lead.chairman_phone || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = {
        school_name: schoolName.trim() || undefined,
        location: location.trim() || null,
        city: city.trim() || null,
        state: stateName.trim() || null,
        board: board.trim() || null,
        principal_name: principalName.trim() || null,
        principal_phone: principalPhone.trim() || null,
        chairman_name: chairmanName.trim() || null,
        chairman_phone: chairmanPhone.trim() || null,
      };

      const res = await fetch(`${API_ROUTES.LEADS}/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update lead');

      onUpdate(json.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Edit Lead Details</Text>
          
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>School Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter school name"
              placeholderTextColor="#64748b"
              value={schoolName}
              onChangeText={setSchoolName}
            />

            <Text style={styles.label}>Location / Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location"
              placeholderTextColor="#64748b"
              value={location}
              onChangeText={setLocation}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  placeholderTextColor="#64748b"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter state"
                  placeholderTextColor="#64748b"
                  value={stateName}
                  onChangeText={setStateName}
                />
              </View>
            </View>

            <Text style={styles.label}>Board (e.g., CBSE, ICSE)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter board"
              placeholderTextColor="#64748b"
              value={board}
              onChangeText={setBoard}
            />

            <View style={styles.divider} />

            <Text style={styles.label}>Principal Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter principal's name"
              placeholderTextColor="#64748b"
              value={principalName}
              onChangeText={setPrincipalName}
            />

            <Text style={styles.label}>Principal Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter principal's phone"
              placeholderTextColor="#64748b"
              value={principalPhone}
              onChangeText={setPrincipalPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.divider} />

            <Text style={styles.label}>Chairman Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter chairman's name"
              placeholderTextColor="#64748b"
              value={chairmanName}
              onChangeText={setChairmanName}
            />

            <Text style={styles.label}>Chairman Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter chairman's phone"
              placeholderTextColor="#64748b"
              value={chairmanPhone}
              onChangeText={setChairmanPhone}
              keyboardType="phone-pad"
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  scroll: {
    flex: 1,
    marginVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    height: 48,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#f8fafc',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
