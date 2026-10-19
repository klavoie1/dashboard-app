package com.klavoie.dashboard.characters;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

interface CharacterRepository extends JpaRepository<StoryCharacter, Long> {

    @Query("select c from StoryCharacter c join c.franchiseIds f where f = :franchiseId order by c.name")
    List<StoryCharacter> findByFranchise(Long franchiseId);

    @Query("select c from StoryCharacter c join c.mediaIds m where m = :mediaId order by c.name")
    List<StoryCharacter> findByMedia(Long mediaId);
}
