#!/bin/bash
# The standard review frames (same places and hours every round): tools/review_set.sh <outdir>
D="$(dirname "$0")"; "$D/london_shoot.sh" "$1" 01_start_night,11.6,-1.5,0,23.5 02_highstreet_night,-118,11.6,-1.75,23.5 03_terrace_day,176,-60,3.14,13 \
  04_boxing_club,-560,139.5,1.2,1 05_weavers_dusk,-185,190,3.14,19.3 06_bramley_towers,183,-200,3.4,22,.15 07_arnold_circus,-690,-375,3.14,23 08_decks,-110,-250,3.14,21,.05 \
  09_church_day,688,6,3.14,11,.1 10_junction_day,-331,-6,2.6,16 11_church_night,688,6,3.14,23,.1 12_wilmot_day,-21.5,-60,3.14,10
