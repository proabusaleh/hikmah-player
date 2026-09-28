import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useSearchStore } from '@/store/useSearchStore';
import { SEARCH_CONFIG } from '@/types/search';

interface SmartSearchBarProps {
  autoFocus?: boolean;
  onFilterPress?: () => void;
  onSubmit?: () => void;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  autoFocus = false,
  onFilterPress,
  onSubmit,
}) => {
  const { query, setQuery, setDebouncedQuery, clearQuery, isSearching, totalResults, filters } =
    useSearchStore();

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const hasActiveFilters =
    filters.mediaType !== 'all' ||
    filters.category !== '' ||
    filters.isLocal !== null ||
    filters.isFavorite !== null;

  const handleChangeText = (text: string) => {
    setQuery(text);

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, SEARCH_CONFIG.DEBOUNCE_MS);
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    clearQuery();
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDebouncedQuery(query);
    onSubmit?.();
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
        {/* Search Icon */}
        {isSearching ? (
          <ActivityIndicator size="small" color={Colors.secondary} />
        ) : (
          <Search size={20} color={isFocused ? Colors.secondary : Colors.dim} />
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search title, artist, tags, playlists..."
          placeholderTextColor={Colors.dim}
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Result Count Badge */}
        {query.length > 0 && totalResults > 0 && !isSearching && (
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>{totalResults}</Text>
          </View>
        )}

        {/* Clear Button */}
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.6}>
            <X size={18} color={Colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      {onFilterPress && (
        <TouchableOpacity
          onPress={onFilterPress}
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          activeOpacity={0.7}
        >
          <SlidersHorizontal
            size={20}
            color={hasActiveFilters ? Colors.background : Colors.muted}
          />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  inputWrapperFocused: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  resultBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.background,
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
});
