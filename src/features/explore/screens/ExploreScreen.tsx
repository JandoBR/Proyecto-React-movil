import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { colors } from '@/src/core/theme/colors';
import { ExploreRepository } from '@/src/features/explore/data/ExploreRepository';
import {
  FOR_YOU_CATEGORY,
  Project,
  ProjectRole,
} from '@/src/features/explore/domain/models';
import { RootStackParamList, TabParamList } from '@/src/navigation/types';
import {
  Avatar,
  BrandLogo,
  Card,
  MatchBadge,
  TagChip,
} from '@/src/ui/components';
import { useAvatarUrl } from '@/src/features/profile/useAvatarUrl';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Explore'>,
  NativeStackScreenProps<RootStackParamList>
>;

const PAGE_SIZE = 20;
const FOR_YOU_POOL = 50;

export default function ExploreScreen({ navigation }: Props) {
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ExploreRepository>(TOKENS.ExploreRepo),
    [di],
  );

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const avatarUrl = useAvatarUrl();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const offsetRef = useRef(0);
  const poolRef = useRef<Project[]>([]);
  const categoriesRef = useRef<string[]>([]);
  const searchRef = useRef('');
  const categoryRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);

  const isForYou = (category: string | null, term: string) =>
    category === FOR_YOU_CATEGORY && !term.trim();

  const load = useCallback(
    async (options?: { category?: string | null; term?: string; pull?: boolean }) => {
      const requestId = ++requestRef.current;
      const term = options?.term ?? searchRef.current;
      const category = options?.category ?? categoryRef.current;
      if (options?.pull) setRefreshing(true);
      else setLoading(true);
      setLoadingMore(false);
      setError(null);

      try {
        let nextCategories = categoriesRef.current;
        if (!nextCategories.length) {
          nextCategories = await repository.getCategories();
          if (requestId !== requestRef.current) return;
          categoriesRef.current = nextCategories;
          setCategories(nextCategories);
          if (!category) {
            const first = nextCategories[0] ?? null;
            categoryRef.current = first;
            setSelectedCategory(first);
          }
        }

        const activeCategory = categoryRef.current;

        if (isForYou(activeCategory, term)) {
          const pool = await repository.getProjects({
            category: FOR_YOU_CATEGORY,
            limit: FOR_YOU_POOL,
            offset: 0,
          });
          if (requestId !== requestRef.current) return;
          pool.sort((a, b) => b.matchPercentage - a.matchPercentage);
          poolRef.current = pool;
          offsetRef.current = Math.min(PAGE_SIZE, pool.length);
          setProjects(pool.slice(0, PAGE_SIZE));
          setHasMore(pool.length > PAGE_SIZE);
        } else {
          poolRef.current = [];
          offsetRef.current = 0;
          const page = await repository.getProjects({
            category: activeCategory,
            search: term,
            limit: PAGE_SIZE,
            offset: 0,
          });
          if (requestId !== requestRef.current) return;
          page.sort((a, b) => b.matchPercentage - a.matchPercentage);
          setProjects(page);
          offsetRef.current = page.length;
          setHasMore(page.length >= PAGE_SIZE);
        }
      } catch {
        if (requestId !== requestRef.current) return;
        setError('No se pudieron cargar los proyectos.');
        setProjects([]);
        setHasMore(false);
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [repository],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [load]),
  );

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    const requestId = requestRef.current;
    setLoadingMore(true);
    try {
      const term = searchRef.current;
      const category = categoryRef.current;
      if (isForYou(category, term)) {
        const next = poolRef.current.slice(
          projects.length,
          projects.length + PAGE_SIZE,
        );
        if (requestId !== requestRef.current) return;
        setProjects((current) => [...current, ...next]);
        setHasMore(projects.length + next.length < poolRef.current.length);
      } else {
        const page = await repository.getProjects({
          category,
          search: term,
          limit: PAGE_SIZE,
          offset: offsetRef.current,
        });
        if (requestId !== requestRef.current) return;
        setProjects((current) => {
          const existing = new Set(current.map((project) => project.id));
          const fresh = page.filter((project) => !existing.has(project.id));
          return [...current, ...fresh].sort(
            (a, b) => b.matchPercentage - a.matchPercentage,
          );
        });
        offsetRef.current += page.length;
        setHasMore(page.length >= PAGE_SIZE);
      }
    } catch {
      if (requestId === requestRef.current) setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const selectCategory = (category: string) => {
    if (categoryRef.current === category) return;
    categoryRef.current = category;
    setSelectedCategory(category);
    load({ category });
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    searchRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load({ term: value }), 350);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load({ pull: true });
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListHeaderComponent={
          <View>
            <BrandLogo
              avatarUrl={avatarUrl}
              onAvatarTap={() => navigation.navigate('Profile')}
            />
            <TextInput
              mode="outlined"
              placeholder="Buscar proyectos, roles o categorías"
              value={search}
              onChangeText={changeSearch}
              left={
                <TextInput.Icon
                  icon={() => (
                    <MaterialCommunityIcons
                      name="magnify"
                      size={20}
                      color={colors.subtle}
                    />
                  )}
                />
              }
              right={
                search ? (
                  <TextInput.Icon
                    icon={() => (
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={colors.subtle}
                      />
                    )}
                    onPress={() => changeSearch('')}
                  />
                ) : undefined
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={styles.search}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {categories.map((category) => {
                const active = category === selectedCategory;
                return (
                  <Pressable
                    key={category}
                    onPress={() => selectCategory(category)}
                    style={[
                      styles.chip,
                      active ? styles.chipActive : styles.chipIdle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && { color: colors.white, fontWeight: '700' },
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ height: 18 }} />
            {loading && !projects.length ? (
              <View style={styles.state}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}
            {!loading && error && !projects.length ? (
              <View style={styles.state}>
                <Text style={styles.stateText}>{error}</Text>
              </View>
            ) : null}
            {!loading && !error && !projects.length ? (
              <View style={styles.state}>
                <Text style={styles.stateText}>
                  {search.trim()
                    ? `No se encontraron proyectos para "${search.trim()}".`
                    : 'No hay proyectos para esta categoría.'}
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <ProjectCard
              project={item}
              onOpen={() =>
                navigation.navigate('ProjectDetail', { projectId: item.id })
              }
            />
          </View>
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !hasMore && projects.length > 0 ? (
            <Text style={styles.footerText}>No hay más proyectos.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  return (
    <Card>
      <View style={styles.authorRow}>
        <Avatar uri={project.authorAvatarUrl} size={44} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.authorName}>{project.authorName}</Text>
          <Text style={styles.authorCareer}>{project.authorCareer}</Text>
        </View>
        <MatchBadge percentage={project.matchPercentage} />
      </View>

      <View style={styles.tagRow}>
        {project.categories.map((category, index) => (
          <TagChip key={`${category}-${index}`} label={category} accent={index === 0} />
        ))}
      </View>

      <Text style={styles.projectTitle}>{project.title}</Text>
      <Text style={styles.projectDescription}>{project.description}</Text>

      {project.roles.length ? (
        <View style={styles.rolesRow}>
          {project.roles.map((role) => (
            <View key={role.name} style={styles.rolePreview}>
              <MaterialCommunityIcons
                name={roleIcon(role)}
                size={16}
                color={colors.subtle}
              />
              <Text style={styles.rolePreviewText}>{role.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.cardDivider} />
      <View style={styles.cardFooter}>
        <Text style={styles.vacancies}>{project.vacancies} vacantes</Text>
        <Pressable onPress={onOpen} style={styles.viewButton}>
          <Text style={styles.viewText}>Ver Proyecto</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color={colors.primaryDark}
          />
        </Pressable>
      </View>
    </Card>
  );
}

function roleIcon(
  role: ProjectRole,
): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  const value = role.name.toLowerCase();
  if (value.includes('visión') || value.includes('computadora')) return 'eye-outline';
  if (value.includes('diseño') || value.includes('ui')) return 'brush-outline';
  if (value.includes('ciencias')) return 'flask-outline';
  if (value.includes('modelo') || value.includes('negocio')) return 'trending-up';
  if (value.includes('biomédica')) return 'dna';
  if (value.includes('iot')) return 'memory';
  if (value.includes('gestión')) return 'account-group-outline';
  return 'briefcase-outline';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  search: { marginTop: 18, backgroundColor: colors.white },
  chips: { gap: 10, paddingTop: 14, paddingBottom: 2 },
  chip: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 24,
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  chipActive: {
    backgroundColor: colors.gradientEnd,
    borderColor: colors.gradientEnd,
  },
  chipIdle: { backgroundColor: colors.white, borderColor: '#E3E3E3' },
  chipText: { fontSize: 13.5, fontWeight: '500', color: colors.textSoft },
  state: { paddingTop: 60, alignItems: 'center' },
  stateText: { color: '#6B6B6B', textAlign: 'center' },
  footerText: {
    paddingVertical: 20,
    textAlign: 'center',
    color: colors.subtle,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorName: { fontSize: 15, fontWeight: '700', color: colors.textSoft },
  authorCareer: { fontSize: 12.5, color: colors.subtle, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  projectTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textSoft,
  },
  projectDescription: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#6B6B6B',
  },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  rolePreview: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rolePreviewText: { fontSize: 12.5, color: colors.body },
  cardDivider: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    paddingTop: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vacancies: { fontSize: 13, color: colors.subtle },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
