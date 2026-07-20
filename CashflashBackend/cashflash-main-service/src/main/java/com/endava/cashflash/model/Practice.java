package com.endava.cashflash.model;

import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
public class Practice {

    public static void main(String[] args) {
        Map<Integer, Integer> m = new HashMap<>();

        m.put(1, 2);
        m.put(4, 4);

        for (Integer i : m.values()) {
             log.info(String.valueOf(i));
        }

        List<String> names = new ArrayList<>();

        names.add("Akshay");
        names.add("Aman");
        names.add("Anush");

        log.info(String.valueOf(names));

        for (String s: names) {
            log.info(s);
        }

        for (int i = 0; i < names.size(); i++) {
            log.info("Roll number: {}, Name: {}", i, names.get(i));
        }

        Map<String, String> dictionary = new HashMap<>();

        dictionary.put("1", "Apple");
        dictionary.put("2", "Ball");
        dictionary.put("3", "Cat");

        for ( String s : dictionary.values()) {
            log.info(s);
        }

        Collection<Integer> firstSet = new ArrayList<>();
        firstSet.add(20);
        firstSet.add(30);
        firstSet.add(40);
        firstSet.add(50);

        Collection<Integer> secondSet = new ArrayList<>();
        secondSet.add(40);
        secondSet.add(50);

        firstSet.addAll(secondSet);
        log.info(firstSet.toString());

        firstSet.removeAll(secondSet);
        log.info(firstSet.toString());

        List<String> colors = new ArrayList<>();

        String[] colorsList = {"Red", "Blue", "Green"};

        colors.addAll(List.of(colorsList));

        log.info(colors.getFirst());
        log.info(colors.get(0));
        log.info(colors.get(colors.size() - 1));
        log.info(colors.getLast());

        Iterator<String> i = colors.iterator();

        while ( i.hasNext()) {
            String color = i.next();
            if(color.equals("Blue")) {
                i.remove();
            }
        }

        log.info(String.valueOf(colors));

        ListIterator<String> li = colors.listIterator(colors.size());

        while(li.hasPrevious()) {
            log.info(String.valueOf(li.previous()));
        }
    }
}
