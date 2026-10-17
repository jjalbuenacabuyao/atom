import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

interface Law {
  n: number;
  stage: string;
  build: string;
  break: string;
  tactics: string[];
  inverse: string[];
}

const LAWS: Law[] = [
  {
    n: 1,
    stage: 'Cue',
    build: 'Make it obvious',
    break: 'Make it invisible',
    tactics: [
      'Fill out the Habits Scorecard to notice what you already do.',
      'Use implementation intentions: “I will [behaviour] at [time] in [location].”',
      'Stack habits: “After [current habit], I will [new habit].”',
      'Design your environment so good cues are visible.',
    ],
    inverse: ['Reduce exposure — remove the cues of bad habits from your surroundings.'],
  },
  {
    n: 2,
    stage: 'Craving',
    build: 'Make it attractive',
    break: 'Make it unattractive',
    tactics: [
      'Bundle a habit you need with something you want.',
      'Join a group where your desired behaviour is the normal behaviour.',
      'Create a short motivation ritual before difficult habits.',
    ],
    inverse: ['Reframe your mindset — focus on the benefits of avoiding the habit.'],
  },
  {
    n: 3,
    stage: 'Response',
    build: 'Make it easy',
    break: 'Make it difficult',
    tactics: [
      'Reduce friction: fewer steps between you and the good habit.',
      'Prime your environment so the next action is ready to go.',
      'Use the two-minute rule: scale the habit down until it takes two minutes.',
      'Automate the habit wherever you can.',
    ],
    inverse: ['Increase friction and use commitment devices to lock in good choices.'],
  },
  {
    n: 4,
    stage: 'Reward',
    build: 'Make it satisfying',
    break: 'Make it unsatisfying',
    tactics: [
      'Give yourself an immediate reward when you complete the habit.',
      'Track your habit and do not break the chain.',
      'Never miss twice — when you slip, get back on track immediately.',
    ],
    inverse: ['Find an accountability partner or make a habit contract with a cost for failure.'],
  },
];

const PRINCIPLES = [
  {
    icon: 'trending_up',
    title: '1% better',
    text: 'Small improvements compound. Getting 1% better every day makes you about 37 times better after a year.',
  },
  {
    icon: 'settings_suggest',
    title: 'Systems over goals',
    text: 'Goals set a direction, but your systems — the daily processes — determine your progress.',
  },
  {
    icon: 'person_heart',
    title: 'Identity first',
    text: 'Decide who you want to be, then prove it to yourself with small wins. Each repetition is a vote.',
  },
  {
    icon: 'hourglass_bottom',
    title: 'The plateau of latent potential',
    text: 'Results often lag behind effort. Keep showing up — the work is being stored, not wasted.',
  },
];

@Component({
  selector: 'app-guide',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './guide.html',
  styleUrl: './guide.scss',
})
export class Guide {
  protected readonly laws = LAWS;
  protected readonly principles = PRINCIPLES;
}
