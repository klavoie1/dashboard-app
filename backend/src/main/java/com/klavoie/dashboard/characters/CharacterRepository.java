package com.klavoie.dashboard.characters;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

interface CharacterRepository extends JpaRepository<StoryCharacter, Long> {

    @Query("select c from StoryCharacter c join c.franchiseIds f where f = :franchiseId order by c.name")
    List<StoryCharacter> findByFranchise(@Param("franchiseId") Long franchiseId);

    // In cast order, main characters first
    @Query("""
            select c from StoryCharacter c, CharacterAppearance a
            where a.characterId = c.id and a.mediaId = :mediaId
            order by case when a.role = 'MAIN' then 0 else 1 end, coalesce(a.position, 9999), c.name""")
    List<StoryCharacter> findByMedia(@Param("mediaId") Long mediaId);

    @Query("select c.id from StoryCharacter c join c.links l where key(l) = :provider and l = :externalId")
    List<Long> findIdsByLink(@Param("provider") String provider, @Param("externalId") String externalId);
}
