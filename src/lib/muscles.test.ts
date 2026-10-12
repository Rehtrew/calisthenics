import { describe, expect, it } from 'vitest'
import { musclesFor, viewsFor } from './muscles'
import { levels } from '../data/programs'

describe('musclesFor', () => {
  it('classifies the common movements', () => {
    expect(musclesFor('Pull ups').primary).toEqual(['lats', 'biceps'])
    expect(musclesFor('Australian chin ups').primary).toEqual(['upper_back', 'lats'])
    expect(musclesFor('Diamond push ups on knees').primary).toEqual(['triceps', 'chest'])
    expect(musclesFor('Pike push ups negatives').primary).toEqual(['shoulders', 'triceps'])
    expect(musclesFor('Wall handstand push ups').primary).toEqual(['shoulders', 'triceps'])
    expect(musclesFor('Squats').primary).toEqual(['quads', 'glutes'])
    expect(musclesFor('Calf raises').primary).toEqual(['calves'])
    expect(musclesFor('Windshield wipers on the ground').primary).toEqual(['obliques', 'abs'])
    expect(musclesFor('Static skills progressions').primary).toEqual(['shoulders', 'abs'])
  })

  it('covers every exercise in the program', () => {
    const missing = new Set<string>()
    for (const level of levels) for (const day of level.days) for (const e of day.exercises) if (musclesFor(e.name).primary.length === 0) missing.add(e.name)
    expect([...missing]).toEqual([])
  })
})

describe('viewsFor', () => {
  it('leads with the back for pulling and adds the front for the biceps', () => {
    expect(viewsFor(musclesFor('Pull ups'))).toEqual(['back', 'front'])
    expect(viewsFor(musclesFor('Australian pull ups'))).toEqual(['back'])
  })
  it('shows only the front for pushing', () => {
    expect(viewsFor(musclesFor('Push ups'))).toEqual(['front'])
    expect(viewsFor(musclesFor('Wall handstand push ups'))).toEqual(['front'])
  })
  it('uses the profile for squats and lunges', () => {
    expect(viewsFor(musclesFor('Squats'))).toEqual(['side'])
    expect(viewsFor(musclesFor('Lunges'))).toEqual(['side'])
  })
  it('pairs front and back when the primaries sit on both sides', () => {
    expect(viewsFor(musclesFor('Muscle ups'))).toEqual(['front', 'back'])
    expect(viewsFor(musclesFor('Chin ups'))).toEqual(['front', 'back'])
    expect(viewsFor(musclesFor('Hiptrusts'))).toEqual(['back'])
    expect(viewsFor(musclesFor('Dips'))).toEqual(['front'])
  })
})
