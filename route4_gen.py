import sys
import os
import time
import numpy as np
import pandas as pd
import threading
import Queue

import SIM_route4

THREAD_LIST = []

class MyopicRequestGenerator(object):
    def __init__(self, number_of_pax, time_between_arrivals, rider_list, rider_q, q_lock, rider_timeline):
        self.number_of_gens = number_of_pax
        self.rest_time = time_between_arrivals


        self.rider_list = rider_list
        self.rider_q = rider_q
        self.q_lock = q_lock

        self.rider_timeline = rider_timeline


    def do_work(self):
        for i in range(0, self.number_of_gens):
            person = SIM_route4.Rider(len(self.rider_list) + i + 1)
            person.decide_destination(0, non_myopic=False)
            self.rider_list.append(person)
            self.rider_q.put(person)
            self.rider_timeline.put(person)

        self.q_lock.acquire()
        print("\n\nMyopic Allotments have arrived!!\n\n")
        self.q_lock.release()


class NonMyopicRequestGenerator(object):
    def __init__(self, number_of_pax, time_between_arrivals,
                 rider_list, rider_q, q_lock, rider_timeline):
        self.number_of_gens = number_of_pax
        self.rest_time = time_between_arrivals


        self.rider_list = rider_list
        self.rider_q = rider_q
        self.q_lock = q_lock
        self.rider_timeline = rider_timeline

    def do_work(self):
        self.q_lock.acquire()
        print("\n\nNon-Myopic Allotments have arrived!!\n\n")
        self.q_lock.release()

        for i in range(0, self.number_of_gens):
            person = SIM_route4.Rider(len(self.rider_list) + i + 1)
            person.decide_destination(type_of_trip=0, non_myopic=True)
            self.rider_list.append(person)
            self.rider_q.put(person)
            self.rider_timeline.put(person)


class FirstMileRequestGenerator(object):
    def __init__(self, number_of_pax, time_between_arrivals,
                 rider_list, rider_q, q_lock, rider_timeline):
        self.number_of_gens = number_of_pax
        self.rest_time = time_between_arrivals

        self.rider_list = rider_list
        self.rider_q = rider_q
        self.q_lock = q_lock
        self.rider_timeline = rider_timeline

    def do_work(self):
        for i in range(0, self.number_of_gens):
            person = SIM_route4.Rider(len(self.rider_list) + i + 1)
            person.decide_destination(type_of_trip=1, non_myopic=False)
            self.rider_list.append(person)
            self.rider_q.put(person)
            self.rider_timeline.put(person)

        self.q_lock.acquire()
        print("\n\nFirst Mile Allotments have arrived!!\n\n")
        self.q_lock.release()



class RiderCollection(object):
    def __init__(self, writer):
        self.rider_list = []
        self.xlsx_writer = writer

    def all_riders_done(self):
        for rider in self.rider_list:
            while rider.am_active:
                pass
        SIM_route4.Rider.store_into_csv(self.xlsx_writer)



class DriverUnion(object):
    def __init__(self, n_autos, writer, timeline):
        self.number_of_drivers = n_autos
        self.driver_queue = SIM_route4.DriverQueue(n_autos)
        self.xlsx_writer = writer
        self.timeline = timeline

        for i in range(0, self.number_of_drivers):
            new_auto = SIM_route4.Driver(i+1)
            self.driver_queue.put(new_auto)
            self.timeline.put(new_auto)

    def close_for_the_day(self):
        for driver_val in self.driver_queue.queue:
            driver = driver_val[1]
            driver.quit_working = True
            while not driver.is_available:
                pass
            print(driver.auto_number, "is done")

        SIM_route4.Driver.store_into_csv(self.xlsx_writer)


class Simulation(object):

    xlsxpath = "output.xlsx"

    def __init__(self,max_dist_from_station=3,
                 n_autos_in_fleet=15,
                 non_myopics_per_burst=5,
                 myopics_per_burst = 5,
                 first_milers_per_burst = 5,
                 time_between_arrivals=20,
                 total_time_of_operation=40,
                 base_auto_speed=30):

        super(Simulation, self).__init__()
        SIM_route4.Rider.max_radius = max_dist_from_station
        SIM_route4.Driver.base_speed = base_auto_speed
        SIM_route4.START_OF_ALL_TIME = time.time()

        self.excel_writer = pd.ExcelWriter(self.xlsxpath)

        tot = non_myopics_per_burst + myopics_per_burst
        self.rider_booking_queue = SIM_route4.RiderQueue(10 * tot)
        self.rider_queue_lock = threading._allocate_lock()

        self.rider_timeline = SIM_route4.RiderTimeline(total_time_of_operation*tot)
        self.driver_timeline = SIM_route4.DriverTimeline(n_autos_in_fleet)

        SIM_route4.Rider.printer_lock = self.rider_queue_lock
        SIM_route4.Driver.rider_queue_lock = self.rider_queue_lock

        self.driver_event_list = []
        self.pax_event_list = []
        SIM_route4.Driver.event_dump = self.driver_event_list
        SIM_route4.Rider.event_dump = self.pax_event_list

        self.rider_coll = RiderCollection(self.excel_writer)
        self.driver_union = DriverUnion(n_autos_in_fleet, self.excel_writer, self.driver_timeline)


        self.advance_booking_queue = SIM_route4.NonMyopicRiderQueue(non_myopics_per_burst*10)


        self.start_of_time = 0
        self.time_of_simulation = total_time_of_operation

        self.drivers_can_quit=True
        self.our_time = 0

        self.time_between_arrivals = time_between_arrivals

        self.myopic_generation = MyopicRequestGenerator(myopics_per_burst, time_between_arrivals,
                                                        self.rider_coll.rider_list, self.rider_booking_queue,
                                                        self.rider_queue_lock, self.rider_timeline)

        self.non_myopic_generation = NonMyopicRequestGenerator(non_myopics_per_burst, time_between_arrivals,
                                                               self.rider_coll.rider_list, self.advance_booking_queue,
                                                               self.rider_queue_lock, self.rider_timeline)

        self.first_mile_generation = FirstMileRequestGenerator(first_milers_per_burst, time_between_arrivals,
                                                               self.rider_coll.rider_list, self.rider_booking_queue,
                                                               self.rider_queue_lock, self.rider_timeline)

    def update_driver_timeline(self):
        while self.time_of_simulation>=0 or not self.rider_timeline.empty():
            while True:
                try:
                    driver_val = self.driver_timeline.get()
                    driver = driver_val[1]
                    if driver.next_active_time > self.our_time:
                        self.driver_timeline.put(driver)
                        break
                    else:
                        driver.current_active_time = driver.next_active_time
                        driver.run()
                        self.driver_timeline.put(driver)
                except Exception as e:
                    print(e.message, self.driver_timeline.empty())
                    if self.driver_timeline.empty(): return
            time.sleep(1)
            self.our_time += 1

        print("drivers at station")

    def update_rider_timeline(self):
        while self.time_of_simulation>=0 or not self.rider_timeline.empty():
            while True:
                if not self.rider_timeline.empty():
                    rider_val = self.rider_timeline.get()
                    rider = rider_val[1]
                    if rider.next_active_time > self.our_time:
                        self.rider_timeline.put(rider)
                        break
                    else:
                        #if not rider.is_myopic: print("Gotcha")
                        rider.current_active_time = rider.next_active_time
                        rider.run()
                        self.rider_timeline.put(rider)
                    #print("rider update")
                else:
                    break
            time.sleep(0.1)
            self.our_time+=1
        print("riders are home")


    def do_allotment(self):
        while self.time_of_simulation >= 0 or not self.rider_booking_queue.empty():
            driver2 = self.driver_union.driver_queue.get()
            self.driver_union.driver_queue.put(driver2[1])

            for driver_val in self.driver_union.driver_queue.queue:
                driver = driver_val[1]

                if driver.is_available and len(driver.allotted_riders) == 0:

                    if not self.rider_booking_queue.empty():
                        if driver.time_to_complete_trip  < 5 and len(driver.customers) == 0:

                            self.rider_booking_queue.auto_location =  None
                            pax_val = self.rider_booking_queue.get()
                            pax = pax_val[1]


                            if (pax.time_spent_in_transit-pax.time_in_metro <= 5):
                                driver.obtain_allotted_customer(pax)
                                print("allotted something")
                            else:
                                self.rider_booking_queue.put(pax)
                                #print("Pax is too far away to allot")
                                #print(self.rider_booking_queue.queue)

                        else:
                            self.rider_booking_queue.auto_location = driver.current_location
                            pax_val = self.rider_booking_queue.get()
                            if pax_val[1].trip_type == 1:
                                driver.obtain_allotted_customer(pax_val[1])
                                print("allotted something")
                            else:
                                self.rider_booking_queue.put(pax_val[1])


            time.sleep(0.1)
        SIM_route4.DONE_WITH_WORK = True
        print("allotments done")

    def new_myopics(self):
        while self.time_of_simulation >= 0:
            self.myopic_generation.do_work()
            time.sleep(self.time_between_arrivals-1)
            self.time_of_simulation -= self.time_between_arrivals
        #self.non_myopic_generation.do_work()
        #time.sleep(1)
        #self.first_mile_generation.do_work()
        #time.sleep(1)
        print("myopics done")

    def reload_non_myopics(self):
        while self.time_of_simulation >= 0 or not self.advance_booking_queue.empty():
            pax_val = self.advance_booking_queue.get()
            if pax_val[0] > 0.3:
                self.advance_booking_queue.put(pax_val[1])
            else:
                self.rider_booking_queue.put(pax_val[1])
                print("someone is arriving")
        time.sleep(0.1)

    def new_non_myopics(self):
        while self.time_of_simulation >= 0:
            self.non_myopic_generation.do_work()
            # time.sleep(2)

            time.sleep(self.time_between_arrivals)

        print("non myopics done")

    def new_first_miles(self):
        time.sleep(0.5 * self.time_between_arrivals)
        while self.time_of_simulation >= 0:
            self.first_mile_generation.do_work()
            # time.sleep(2)
            time.sleep(self.time_between_arrivals)

        print("first mile done")


    def run(self):

        rider_event_thread = threading.Thread(target=self.update_rider_timeline, name="Rider")
        driver_event_thread = threading.Thread(target=self.update_driver_timeline, name="Driver")
        allotment_thread = threading.Thread(target=self.do_allotment, name="allotment")
        myopics_thread = threading.Thread(target=self.new_myopics, name="arrivals")
        #non_myopics_thread = threading.Thread(target=self.new_non_myopics, name="bookings")
        #move_non_myopics_thread = threading.Thread(target=self.reload_non_myopics, name="slidings")
        #first_mile_thread = threading.Thread(target=self.new_first_miles, name="fms")

        rider_event_thread.start()
        driver_event_thread.start()
        #non_myopics_thread.start()
        allotment_thread.start()
        myopics_thread.start()
        #move_non_myopics-_thread.start()
        #first_mile_thread.start()

        disp_stats = 0
        while self.time_of_simulation >= 0 or not self.rider_booking_queue.empty():
            if disp_stats == 5:
                print("\n\n")
                for driver_val in self.driver_timeline.queue:
                    break
                    driver = driver_val[1]
                    print(driver.name, driver.on_return, len(driver.customers),
                          len(driver.allotted_riders), driver.current_location)
                disp_stats = 0

                print("time: " + str(SIM_route4.gimme_current_time()))
                print("booking queue is: " + str(self.rider_booking_queue.qsize()))
                print("rider timeline queue is: " + str(self.rider_timeline.qsize()) + "\n\n")

            time.sleep(1)

            self.our_time += 1
            disp_stats+=1

        #non_myopics_thread.join()
        #move_non_myopics_thread.join()
        myopics_thread.join()
        #first_mile_thread.join()
        allotment_thread.join()
        rider_event_thread.join()
        driver_event_thread.join()

        print("\n\n\n\nWRAP UP\n\n\n\n")
        self.rider_coll.all_riders_done()
        self.driver_union.close_for_the_day()

        df = pd.DataFrame(self.driver_event_list, columns=SIM_route4.EVENTS_COLUMNS_FORMAT)
        df.to_excel(self.excel_writer, sheet_name="Driver Events")

        df2 = pd.DataFrame(self.pax_event_list, columns=SIM_route4.EVENTS_COLUMNS_FORMAT)
        df2.to_excel(self.excel_writer, sheet_name="Rider Events")

        self.excel_writer.save()
        print("DONE!!!!!")


def main2():
    os.chdir("C:\Users\Gautham\PycharmProjects\SIBES_auto")
    new_sim = Simulation()
    new_sim.run()


def main():
    main2()



if __name__ == "__main__":
    main()