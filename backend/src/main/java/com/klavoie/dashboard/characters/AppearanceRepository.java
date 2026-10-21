package com.klavoie.dashboard.characters;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

interface AppearanceRepository extends JpaRepository<CharacterAppearance, CharacterAppearance.Key> {

    @Query("""
            select new com.klavoie.dashboard.characters.AppearanceView(a.characterId, a.mediaId, m.title, m.kind, m.cover,
                   a.role, a.actor, a.actorLanguage, a.position)
            from CharacterAppearance a join com.klavoie.dashboard.media.Media m on m.id = a.mediaId
            where a.characterId in :ids
            order by m.title""")
    List<AppearanceView> findViews(@Param("ids") Collection<Long> characterIds);

    List<CharacterAppearance> findByMediaId(Long mediaId);

    List<CharacterAppearance> findByCharacterId(Long characterId);
}
