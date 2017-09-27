import time
import numpy as np
import pandas as pd
import threading
import heapq
import Queue

import event_desc


EVENTS_COLUMNS_FORMAT = ["Event ID", "Driver ID", "Passenger ID", "Location", "Event Category", "Event", "Timestamp", "Comments"]
LIST_OF_ORIGIN_STATIONS = [("Mysore Rd", 20), ("Deepanjali Nagar", 15), ("Vijayanagar", 10)]

GLOB_SLEEP_RATIO = 1
START_OF_ALL_TIME = 0

DONE_WITH_WORK = False
LIST_OF_ALL_EVENTS_THAT_HAPPENED = None
WAITING_QUEUE = None
WAITING_QUEUE_LOCK = None

def dist2d(a, b):
    return np.sum(np.abs(a - b))

def gimme_current_time():
    return time.time() - START_OF_ALL_TIME

def get_pricing(dist):
    if dist < 2:
        price = 25
    else:
        price = 25 + 14 * (dist - 2)
    # print("Distance is: " + str(dist) + "km, price is " + str(price))
    return price


class Rider(object):
    path_of_storage_csv = "rider_data.csv"

    storage_column_list = ["ID", "Name", "Trip Type", "Myopic Trip",
                           "Origin", "Location of Origin", "Destination", "Location of Destination",
                           "Allotted Driver", "Amount Paid",
                           "Time of Request", "Time in transit", "Time of Arrival",
                           "Time spent waiting", "Start of Travel Time",
                           "End of Travel Time", "Time spent travelling",
                           "Additional Info"]

    storage_row_list = []
    event_dump = LIST_OF_ALL_EVENTS_THAT_HAPPENED

    max_radius = 20.0

    printer_lock = None
    waiting_queue = None

    def __init__(self, id_number):
        super(Rider, self).__init__()
        self.ID = id_number
        self.name = "Person #" + str(self.ID)
        self.patience = 5

        self.time_of_request = 0
        self.time_spent_in_transit = 0
        self.time_of_arrival_at_station = 0
        self.time_spent_waiting = 0
        self.start_of_travel_time = 0
        self.end_of_travel_time = 0
        self.time_spent_traveling = 0

        self.am_active = True
        self.in_metro = True
        self.time_in_metro = 0
        self.amount_paid = 0

        self.status = None

        self.trip_type = 0  # 0 - last mile, 1 - first mile
        self.is_myopic = False
        self.trip_origin = np.zeros(2, dtype=np.float32)
        self.trip_destination = np.zeros(2, dtype=np.float32)
        self.trip_distance = 0
        self.current_location = np.zeros(2, dtype=np.float32)

        self.driver = None
        self.picked_up_by_driver = False

        self.priority = np.inf
        self.current_active_time = 0
        self.next_active_time = np.inf

    def decide_destination(self, type_of_trip, non_myopic=True):
        self.time_of_request = gimme_current_time()
        self.current_active_time = self.time_of_request

        if type_of_trip == 1:
            # decide whether first-mile (where is he coming from)
            self.trip_type = 1
            self.trip_origin = np.random.normal(0, Rider.max_radius, 2)


        else:
            # Or last mile (where is he going to, myopic/non-myopic)
            self.trip_type = 0
            self.trip_destination = np.random.normal(0, Rider.max_radius, 2)
            if non_myopic:
                station = LIST_OF_ORIGIN_STATIONS[np.random.randint(0, len(LIST_OF_ORIGIN_STATIONS))]
                self.time_spent_in_transit = station[1]
                self.is_myopic = False
                self.update_status("Pax 0M Non-Myopic")
            else:
                self.in_metro = False
                self.time_spent_in_transit = 0
                self.is_myopic = True
                self.update_status("Pax 0M Myopic")

        self.trip_distance = dist2d(self.trip_origin, self.trip_destination)
        self.time_of_arrival_at_station = self.time_spent_in_transit + self.time_of_request
        self.run()

    def set_priority(self, auto_loc=None):
        if self.trip_type == 0:
            if self.is_myopic:
                self.priority = (0.01 * self.trip_distance) / (1 + 5* (self.current_active_time - self.time_of_request))

            else:
                print("\n\n\n\n\n\n\n\nSETTING PRIORITY NM\n\n\n\n\n\n\n\n\n\n")
                self.priority = (0.01 * self.trip_distance) / (1 + 20 * (self.current_active_time - self.time_of_request))


        else:
            if auto_loc is not None:
                self.priority = (0.01 * (self.trip_distance + dist2d(auto_loc, self.trip_origin))) / (1 + 10 * (gimme_current_time() - self.time_of_request))
            else:
                self.priority = np.inf


    def obtain_allotted_driver(self, driver):
        # find out who the driver allotted to you is
        self.driver = driver
        self.update_status("Pax knows Dri", "Pax")
        pass

    def update_location(self, location):
        self.current_location = location
        self.update_status("Pax updates Location")


    def start_of_trip(self):
        self.start_of_travel_time = gimme_current_time()
        self.time_spent_waiting = self.start_of_travel_time - self.time_of_arrival_at_station
        self.picked_up_by_driver = True
        self.update_status("Pax enters " + str(self.trip_type) + "M", str(self.time_spent_waiting) + "  " +str(self.is_myopic))

    def end_of_trip(self):
        # will run once customer has reached required destination
        self.update_status("Pax "+str(self.trip_type)+"M Done")
        self.am_active = False
        self.store_final_information()
        pass

    def update_status(self, event_description, comments="Pax"):
        # will update current status, saying whether he is waiting/in auto/in transit/etc

        timestamp = gimme_current_time()
        event_ID = timestamp

        if self.driver:
            driver_ID = self.driver.auto_number
        else:
            driver_ID = -1
        event_category = event_desc.get_event_category(event_description)

        new_event = (event_ID, driver_ID, self.ID, self.current_location, event_category, event_description, timestamp, comments)
        self.printer_lock.acquire()
        print(new_event)
        self.printer_lock.release()
        Rider.event_dump.append(new_event)

        pass

    def run(self):
        if self.am_active:
            if self.in_metro:
                self.update_status("Pax in Train")

                if (self.time_in_metro <= self.time_spent_in_transit):
                    self.time_in_metro += 3.01
                    self.next_active_time = self.current_active_time + 3.01
                    print(self.name, self.next_active_time)
                    time.sleep(0.1)

                self.time_of_arrival_at_station = self.time_spent_in_transit + self.time_of_request
                self.in_metro = False

                self.update_status("Pax deboards Train")

            elif self.driver is None:
                self.update_status("Pax waiting Dri", "No Driver allotted :(")

            elif (not self.picked_up_by_driver):
                self.update_status("Pax waiting Dri", "Driver on his way")

            else:
                pass

            # we might have other things to do/decide here
            # but then again once pax is inside vehicle we need do nothing
            self.next_active_time = self.current_active_time + 5
            return
        else:
            self.store_final_information()

    def store_final_information(self):
        self.end_of_travel_time = self.current_active_time
        self.time_spent_traveling = self.end_of_travel_time - self.start_of_travel_time

        self.next_active_time = np.inf

        obj_info = (self.ID, self.name, self.trip_type, self.is_myopic, "", self.trip_origin,
                    "", self.trip_destination, self.driver.auto_number, self.amount_paid,
                    self.time_of_request, self.time_spent_in_transit, self.time_of_arrival_at_station,
                    self.time_spent_waiting, self.start_of_travel_time, self.end_of_travel_time,
                    self.time_spent_traveling, "")
        Rider.storage_row_list.append(obj_info)

    @classmethod
    def store_into_csv(cls, writer):
        df = pd.DataFrame.from_records(cls.storage_row_list, columns=cls.storage_column_list)
        df.to_csv(cls.path_of_storage_csv)
        if writer is not None:
            df.to_excel(excel_writer=writer, sheet_name="Riders")
        print("Successfully stored all rider information from this simulation")



class RiderQueue(Queue.PriorityQueue):

    def __init__(self, maxsize):
        Queue.PriorityQueue.__init__(self,maxsize=maxsize)
        self.auto_location = None

    def _put(self, person, heappush=heapq.heappush):
        for people_val in self.queue:
            people = people_val[1]
            people.set_priority()
            people_val = (people.priority, people)

        person.set_priority()
        Queue.PriorityQueue._put(self, (person.priority, person))

    def _get(self, heappop=heapq.heappop):
        for people_val in self.queue:
            people = people_val[1]
            people.set_priority(self.auto_location)
            people_val = (people.priority, people)

        person_val = Queue.PriorityQueue._get(self, heappop)
        Queue.PriorityQueue._put(self,person_val)

        return Queue.PriorityQueue._get(self, heappop)


class NonMyopicRiderQueue(Queue.PriorityQueue):

    def __init__(self, maxsize):
        Queue.PriorityQueue.__init__(self,maxsize=maxsize)
        self.auto_location = None

    def _put(self, person, heappush=heapq.heappush):
        for people_val in self.queue:
            people = people_val[1]
            people_val = (1 - people.time_in_metro/people.time_spent_in_transit, people)
        Queue.PriorityQueue._put(self, (1 - person.time_in_metro/person.time_spent_in_transit, person))

    def _get(self, heappop=heapq.heappop):
        for people_val in self.queue:
            people = people_val[1]
            people_val = (1 - people.time_in_metro/people.time_spent_in_transit, people)

        person_val = Queue.PriorityQueue._get(self, heappop)
        Queue.PriorityQueue._put(self,person_val)

        return Queue.PriorityQueue._get(self, heappop)


class RiderTimeline(Queue.PriorityQueue):
    def __init__(self, maxsize):
        Queue.PriorityQueue.__init__(self,maxsize=maxsize)

    def _put(self, person, heappush=heapq.heappush):
        Queue.PriorityQueue._put(self, (person.next_active_time, person))

    def _get(self, heappop=heapq.heappop):
        for people_val in self.queue:
            if people_val[0] == np.inf:
                print(people_val[1].name + "is done")
                self.queue.remove(people_val)

        if not self.empty():
            person_val = Queue.PriorityQueue._get(self, heappop)
            Queue.PriorityQueue._put(self, person_val)

        return Queue.PriorityQueue._get(self, heappop)




class Driver(object):
    event_dump = LIST_OF_ALL_EVENTS_THAT_HAPPENED

    path_of_storage_csv = "driver_data.csv"
    storage_row_list = []
    storage_column_list = ["ID", "Name", "Average Speed",
                           "Start of Operation Time", "End of Operation Time",
                           "Total Time in Service", "Total Inactive Time",
                           "Total Cash Earned", "Total Distance Travelled",
                           "Number of Trips Taken","Additional Info"]


    base_speed = 20.0
    rider_queue = WAITING_QUEUE
    rider_queue_lock = WAITING_QUEUE_LOCK

    def __init__(self, auto_number):

        super(Driver, self).__init__()

        self.auto_number = auto_number
        self.name = "Auto #" + str(self.auto_number)
        self.speed = (self.base_speed) / 60.0

        self.current_location = np.zeros(2, dtype=np.float32)

        self.trip_type = 0
        self.start_point_of_trip = np.zeros(2, dtype=np.float32)
        self.destination_of_trip = np.zeros(2, dtype=np.float32)
        self.distance_to_be_travelled = 0
        self.time_to_complete_trip = 0

        self.direction_towards_destination = np.zeros(2, dtype=np.float32)

        self.start_of_operation_time = gimme_current_time()
        self.end_of_operation_time = 0

        self.start_of_inactive_time = 0
        self.end_of_inactive_time = 0

        self.total_time_being_inactive = 0
        self.time_on_travel = 0
        self.total_distance_travelled = 0

        self.total_cash_earned = 0
        self.no_of_trips_taken = 0

        self.capacity = 1
        self.customers = []

        self.allotted_riders = []

        self.status = 0


        self.at_station = True
        self.is_available = True
        self.quit_working = False
        self.on_return = False


        self.priority = np.inf

        self.current_active_time = 0
        self.next_active_time = np.inf
        self.run()

    def update_status(self, event_description, comments = "Dri"):
        # possibly change things for the event dump here
        # and do the event dump also
        timestamp = gimme_current_time()
        event_ID = timestamp

        if len(self.customers) > 0:
            pax_ID = self.customers[0].ID
        else:
            pax_ID = -1
        event_category = event_desc.get_event_category(event_description)

        new_event = (event_ID, self.auto_number, pax_ID, self.current_location, event_category, event_description, timestamp, comments)
        self.rider_queue_lock.acquire()
        print(new_event)
        self.rider_queue_lock.release()
        Driver.event_dump.append(new_event)

    def service_start(self):
        self.update_status("Dri day Start")

    def obtain_allotted_customer(self, person):
        # is this going to be used?
        # wait, we need to define what the Queue will be doing
        self.allotted_riders.append(person)
        self.update_status("Dri adds Pax")
        person.obtain_allotted_driver(self)
        if self.at_station:
            if (person.in_metro):
                self.next_active_time = self.current_active_time + 1
                return
            self.pickup_customer(self.allotted_riders.pop())
        pass

    def run(self):
        if not self.quit_working or not self.is_available:
            self.update_location()
            self.journey_check()
            self.delay()
            # do other things here
            return
        else:
            if self.next_active_time != np.inf:
                self.store_final_information()

    def update_location(self):
        if not self.at_station:
            self.current_location = self.current_location + self.speed*self.direction_towards_destination
            self.update_status("Dri updates Location")
            if len(self.customers)>0:
                self.customers[0].update_location(self.current_location)
        else:
            self.ready_at_station()

    def delay(self):
        # amount of time between each event update, ie iteration of run()
        t = 1
        try:
            if not self.is_available and len(self.customers) > 0:
                t = t + 0.1 * (self.distance_to_be_travelled / self.speed) + np.random.normal(0, 0.5, 1)
        except Exception as e:
            t = 1
        finally:
            self.time_to_complete_trip -= t
            self.next_active_time = self.current_active_time + t


    def set_destination(self, dest, trip_type):
        # set the trip logic for the current trip by the driver
        self.start_point_of_trip = self.current_location
        self.destination_of_trip = dest
        self.distance_to_be_travelled = dist2d(self.destination_of_trip, self.start_point_of_trip)
        self.trip_type = trip_type
        self.direction_towards_destination = (self.destination_of_trip - self.start_point_of_trip) / self.distance_to_be_travelled

    def pickup_customer(self, person):
        self.total_distance_travelled = self.total_distance_travelled + dist2d(self.current_location, self.start_point_of_trip)
        self.customers.append(person)
        self.set_destination(person.trip_destination, person.trip_type)

        if self.start_of_inactive_time > 0:
            self.end_of_inactive_time = self.current_active_time
            t = (self.end_of_inactive_time - self.start_of_inactive_time)
            self.total_time_being_inactive = self.total_time_being_inactive + t
            self.start_of_inactive_time = 0

        self.is_available = False
        self.at_station = False

        self.no_of_trips_taken += 1
        self.on_return = False

        self.time_to_complete_trip = self.distance_to_be_travelled/self.speed

        self.update_status("Dri picks "+str(self.trip_type)+"M Pax")
        person.start_of_trip()
        self.next_active_time = self.current_active_time + 0.1

    def collect_payment(self):
        cash = get_pricing(self.distance_to_be_travelled)
        self.total_cash_earned = self.total_cash_earned + cash
        self.customers[0].amount_paid = cash

    def drop_customer(self):
        self.collect_payment()
        p = self.customers.pop()
        p.end_of_trip()
        self.update_status("Dri drops "+str(self.trip_type)+"M Pax")
        self.on_return = True

    def ready_at_station(self):
        self.destination_of_trip = np.zeros(2, dtype=np.float32)
        self.direction_towards_destination = np.zeros(2, dtype=np.float32)
        self.start_point_of_trip = np.zeros(2, dtype=np.float32)
        self.is_available = True
        self.distance_to_be_travelled = 0

        self.start_of_inactive_time = gimme_current_time()
        self.update_status("Dri ready Station")
        self.at_station = True
        self.time_to_complete_trip = 0

        while len(self.allotted_riders) > 0:
            pax = self.allotted_riders[0]
            if pax.in_metro:
                #print(self.name+"  waiting for metro boy:  "+pax.name)
                return
            self.pickup_customer(pax)
            self.allotted_riders.pop()
            return

        self.quit_working = DONE_WITH_WORK

    def return_home(self, zero):
        self.start_point_of_trip = self.current_location
        self.direction_towards_destination = (zero - self.start_point_of_trip) / self.distance_to_be_travelled
        self.destination_of_trip = zero
        self.time_to_complete_trip = self.distance_to_be_travelled / self.speed
        self.trip_type = -1
        self.delay()


    def journey_check(self):
        zero = np.zeros(2, dtype=np.float32)
        if not self.is_available:
            if not self.on_return:
                a = dist2d(self.start_point_of_trip, self.current_location)
                b = dist2d(self.start_point_of_trip, self.destination_of_trip)
                t = np.abs(a - b) < 0.3

                if t:
                    self.drop_customer()
                    self.total_distance_travelled = self.total_distance_travelled + self.distance_to_be_travelled
                    if len(self.allotted_riders) == 0:
                        self.return_home(zero)
                    else:
                        self.return_home(self.allotted_riders[0].trip_origin)
            else:
                zero = np.zeros(2, dtype=np.float32)
                a = dist2d(self.start_point_of_trip, self.current_location)
                b = dist2d(self.start_point_of_trip, self.destination_of_trip)
                c = dist2d(self.current_location, zero)

                t = np.abs(a-b)<0.3 or c<0.3

                if t:
                    self.ready_at_station()
                    self.delay()


    def set_priority(self):
        if not self.is_available:
            self.priority = np.inf
        else:
            self.priority = self.total_cash_earned/(1+self.no_of_trips_taken)


    def store_final_information(self):
        # have a variable to store aggregate person data
        self.end_of_operation_time = self.current_active_time

        t1 = self.end_of_operation_time - self.start_of_operation_time
        obj_info = (self.auto_number, self.name, self.base_speed,
                    self.start_of_operation_time, self.end_of_operation_time,
                    t1, self.total_time_being_inactive, self.total_cash_earned,
                    self.total_distance_travelled, self.no_of_trips_taken, "")

        Driver.storage_row_list.append(obj_info)
        self.next_active_time = np.inf
        pass


    @classmethod
    def store_into_csv(cls, writer):
        df = pd.DataFrame.from_records(cls.storage_row_list, columns=cls.storage_column_list)
        df.to_csv(cls.path_of_storage_csv)
        if writer is not None:
            df.to_excel(excel_writer=writer, sheet_name="Drivers")
        print("Successfully stored all Driver information from this simulation")





class DriverQueue(Queue.PriorityQueue):

    def __init__(self, maxsize):
        Queue.PriorityQueue.__init__(self,maxsize=maxsize)

    def _put(self, driver, heappush=heapq.heappush):
        for rickshaw_val in self.queue:
            rickshaw = rickshaw_val[1]
            rickshaw.set_priority()
            rickshaw_val = (rickshaw.priority, rickshaw)

        driver.set_priority()
        Queue.PriorityQueue._put(self, (driver.priority, driver))

    def _get(self, heappop=heapq.heappop, rickshaw_location=None):
        for rickshaw_val in self.queue:
            rickshaw = rickshaw_val[1]
            rickshaw.set_priority()
            rickshaw_val = (rickshaw.priority, rickshaw)

        driver_val = Queue.PriorityQueue._get(self, heappop)
        Queue.PriorityQueue._put(self,driver_val)

        return Queue.PriorityQueue._get(self, heappop)



class DriverTimeline(Queue.PriorityQueue):

    def __init__(self, maxsize):
        Queue.PriorityQueue.__init__(self,maxsize=maxsize)

    def _put(self, driver, heappush=heapq.heappush):
        Queue.PriorityQueue._put(self, (driver.next_active_time, driver))

    def _get(self, heappop=heapq.heappop, rickshaw_location=None):
        for rickshaw_val in self.queue:
            if rickshaw_val[0] == np.inf:
                print(rickshaw_val[1].name + "is done")
                self.queue.remove(rickshaw_val)

        driver_val = Queue.PriorityQueue._get(self, heappop)
        Queue.PriorityQueue._put(self,driver_val)
        return Queue.PriorityQueue._get(self, heappop)
